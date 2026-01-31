import { getProjectFromName } from "@service/ReadContractService";
import { loadedPublicKey } from "@service/walletService";
import {
  setConfigData,
  setProject,
  setProjectRepoInfo,
} from "@service/StateService";
import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button.tsx";
import Input from "components/utils/Input.tsx";
import Label from "components/utils/Label.tsx";
import FlowProgressModal from "components/utils/FlowProgressModal.tsx";
import Step from "components/utils/Step.tsx";
import Title from "components/utils/Title.tsx";
import { useState, type FC, useEffect } from "react";
import { getAuthorRepo } from "utils/editLinkFunctions";
import { extractConfigData, toast } from "utils/utils";
import {
  validateProjectName as validateProjectNameUtil,
  validateGithubUrl,
  validateMaintainerAddress,
} from "utils/validations.ts";
import Textarea from "components/utils/Textarea.tsx";
import Spinner from "components/utils/Spinner.tsx";

type ModalProps = {
  onClose: () => void;
};

const CreateProjectModal: FC<ModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectFullName, setProjectFullName] = useState("");
  const [maintainerAddresses, setMaintainerAddresses] = useState<string[]>([
    loadedPublicKey() || "",
  ]);

  const [maintainerGithubs, setMaintainerGithubs] = useState<string[]>([""]);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [domainStatus, setDomainStatus] = useState<
    "checking" | "available" | "unavailable" | null
  >(null);

  // Form validation errors
  const [projectNameError, setProjectNameError] = useState<string | null>(null);
  const [projectFullNameError, setProjectFullNameError] = useState<string | null>(null);
  const [maintainersErrors, setMaintainersErrors] = useState<
    Array<string | null>
  >([null]);
  const [githubRepoUrlError, setGithubRepoUrlError] = useState<string | null>(
    null,
  );

  // Project documentation data (will be written to tansu.toml and uploaded to IPFS)
  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  // Org field validation errors
  const [orgNameError, setOrgNameError] = useState<string | null>(null);
  const [orgUrlError, setOrgUrlError] = useState<string | null>(null);
  const [orgLogoError, setOrgLogoError] = useState<string | null>(null);
  const [orgDescriptionError, setOrgDescriptionError] = useState<string | null>(
    null,
  );

  // Flow state management
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDomainExists = async (domain: string): Promise<boolean> => {
    try {
      const project = await getProjectFromName(domain);
      return !!project && project.name === domain;
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes("No project defined") ||
          error.message.includes("not found") ||
          error.message.includes("record not found") ||
          error.message.includes("Invalid Key") ||
          error.message.includes("Domain not found") ||
          error.message.includes("Domain does not exist"))
      ) {
        return false;
      }
      throw error;
    }
  };

  useEffect(() => {
    setMaintainersErrors(maintainerAddresses.map(() => null));
    setGithubHandleErrors(maintainerGithubs.map(() => null));
  }, [maintainerAddresses.length]);

  // Check domain availability with debounce
  useEffect(() => {
    if (!projectName || projectName.length < 4) {
      setDomainStatus(null);
      return;
    }

    setDomainStatus("checking");

    const timeout = setTimeout(async () => {
      const nameError = validateProjectNameUtil(projectName);
      if (nameError) {
        setDomainStatus(null);
        return;
      }
      try {
        const exists = await checkDomainExists(projectName);
        setDomainStatus(exists ? "unavailable" : "available");
      } catch {
        setDomainStatus(null);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [projectName]);

  const validateMaintainers = () => {
    let isValid = true;

    const addrErrors = maintainerAddresses.map((addr) => {
      const error = validateMaintainerAddress(addr);
      if (error) {
        isValid = false;
        return error;
      }
      return null;
    });

    const ghRegex = /^[A-Za-z0-9_-]{1,30}$/;
    const ghErrors = maintainerGithubs.map((gh) => {
      if (!gh || gh.trim() === "") {
        isValid = false;
        return "GitHub handle is required";
      }
      if (!ghRegex.test(gh)) {
        isValid = false;
        return "Handle must be ASCII (letters, digits, _ or -) and ≤30 chars";
      }
      return null;
    });

    setMaintainersErrors(addrErrors);
    setGithubHandleErrors(ghErrors);
    return isValid;
  };

  const validateGithubRepoUrl = () => {
    const error = validateGithubUrl(githubRepoUrl);
    setGithubRepoUrlError(error);
    return error === null;
  };

  // Simple validators for the new organisation fields
  const validateOrgFields = (): boolean => {
    let valid = true;

    if (!orgName.trim()) {
      setOrgNameError("Organization name is required");
      valid = false;
    }

    if (orgUrl && !orgUrl.startsWith("https://")) {
      setOrgUrlError("URL must start with https://");
      valid = false;
    }

    if (orgLogo && !orgLogo.startsWith("https://")) {
      setOrgLogoError("Logo URL must start with https://");
      valid = false;
    }

    if (!orgDescription.trim() || orgDescription.split(/\s+/).length < 3) {
      setOrgDescriptionError("Description must contain at least 3 words");
      valid = false;
    }

    return valid;
  };

  const handleRegisterProject = async () => {
    setIsLoading(true);
    // Dynamic imports for heavy libs
    const [{ fetchTomlFromCid }] = await Promise.all([
      import("utils/ipfsFunctions"),
    ]);
    const { loadedPublicKey } = await import("@service/walletService");

    try {
      const publicKey = loadedPublicKey();
      if (!publicKey) {
        throw new Error("Please connect your wallet first");
      }

      const tomlContent = `VERSION="2.0.0"

ACCOUNTS=[
${maintainerAddresses.map((a) => `    "${a}"`).join(",\n")}
]

[DOCUMENTATION]
ORG_DBA="${projectFullName.trim()}"
ORG_NAME="${orgName}"
ORG_URL="${orgUrl}"
ORG_LOGO="${orgLogo}"
ORG_DESCRIPTION="${orgDescription}"
ORG_GITHUB="${githubRepoUrl.split("https://github.com/")[1] || ""}"

${maintainerGithubs.map((gh) => `[[PRINCIPALS]]\ngithub="${gh}"`).join("\n\n")}
`;

      const tomlFile = new File([tomlContent], "tansu.toml", {
        type: "text/plain",
      });

      // show progress
      setStep(6);

      const { createProjectFlow } = await import("@service/FlowService");

      await createProjectFlow({
        projectName, // on-chain identifier
        tomlFile,
        githubRepoUrl,
        maintainers: maintainerAddresses,
        onProgress: setStep,
      });

      // ── Continue with existing UI/state updates ───────────────────────
      const project = await getProjectFromName(projectName);
      if (project && project.name && project.config && project.maintainers) {
        setProject(project);

        const { username, repoName } = getAuthorRepo(project.config.url);
        if (username && repoName) {
          setProjectRepoInfo(username, repoName);
        }

        const tomlData = await fetchTomlFromCid(project.config.ipfs);
        if (tomlData) {
          const configData = extractConfigData(tomlData, project);
          setConfigData(configData);
        } else {
          setConfigData({});
        }
      }

      setStep(10);

      toast.success("Success", "Project has been registered successfully!");

      onClose();

      navigate(`/project?name=${projectName}`);
    } catch (err: any) {
      toast.error("Something Went Wrong!", err.message);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Validate project name and set error
  const validateAndSetProjectNameError = async () => {
    const nameError = validateProjectNameUtil(projectName);
    if (nameError) {
      setProjectNameError(nameError);
      return false;
    }

    try {
      const exists = await checkDomainExists(projectName);
      if (exists) {
        setProjectNameError("Already registered");
        return false;
      }
    } catch {
      // Continue on error
    }

    setProjectNameError(null);
    return true;
  };

  const [githubHandleErrors, setGithubHandleErrors] = useState<
    Array<string | null>
  >([null]);

  return (
    <FlowProgressModal
      isOpen={true}
      onClose={onClose}
      onSuccess={() => {
        onClose();
        navigate(`/project?name=${projectName}`);
      }}
      step={step}
      setStep={setStep}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isUploading={isUploading}
      setIsUploading={setIsUploading}
      isSuccessful={isSuccessful}
      setIsSuccessful={setIsSuccessful}
      error={error}
      setError={setError}
      signLabel="project registration"
      successTitle="Your Project Is Live!"
      successMessage="Congratulations! You've successfully created your project. Let's get the ball rolling!"
    >
      {step == 1 ? (
        <div
          key={step}
          className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]"
        >
          <img
            className="flex-none w-[140px] md:w-[260px]"
            src="/images/megaphone.svg"
          />
          <div className="flex flex-col gap-6 md:gap-[42px] w-full">
            <div className="flex flex-col gap-4 md:gap-[30px]">
              <div className="flex-grow flex flex-col gap-4 md:gap-[30px]">
                <div className="flex flex-col gap-3 md:gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Welcome to Your New Project!"
                    description="Add your project name and display name to get started."
                  />
                </div>
                <div className="relative">
                  <Input
                    label="Project Name (On-chain)"
                    placeholder="Write the project name (e.g., myproject)"
                    value={projectName}
                    onChange={(e) => {
                      // Only allow lowercase letters a-z
                      const validInput = e.target.value.replace(/[^a-z]/g, "");
                      setProjectName(validInput);
                      setProjectNameError(null); // Clear error when typing
                    }}
                    description={
                      projectName.length >= 4 &&
                      projectName.length <= 15 &&
                      /^[a-z]+$/.test(projectName)
                        ? "This will be your unique on-chain identifier (e.g., myproject.xlm)"
                        : "Project name should be between 4-15 lowercase letters (a-z)"
                    }
                    error={projectNameError}
                  />
                  {domainStatus && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/3 flex items-center">
                      {domainStatus === "checking" ? (
                        <Spinner />
                      ) : domainStatus === "available" ? (
                        <div className="flex items-center text-green-600">
                          <img
                            src="/icons/check.svg"
                            alt="Available"
                            className="h-5 w-5 mr-1"
                          />
                          <span className="text-sm">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <img
                            src="/icons/failed.svg"
                            alt="Unavailable"
                            className="h-5 w-5 mr-1"
                          />
                          <span className="text-sm">Unavailable</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Input
                  label="Project Full Name"
                  placeholder="My Awesome Project"
                  value={projectFullName}
                  onChange={(e) => {
                    setProjectFullName(e.target.value);
                    setProjectFullNameError(null);
                  }}
                  description="Human-readable name shown in the UI (can be longer than 15 characters)."
                  error={projectFullNameError}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-[18px]">
              <Button
                type="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                isLoading={isLoading}
                className="w-full sm:w-auto"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    // Validate project full name (required)
                    if (!projectFullName.trim()) {
                      setProjectFullNameError("Project full name is required");
                      setIsLoading(false);
                      return;
                    }
                    
                    // Perform project name validation
                    const isValid = await validateAndSetProjectNameError();

                    if (isValid) {
                      setStep(step + 1);
                    }
                  } catch (err: any) {
                    setProjectNameError(
                      err.message || "Project name validation failed",
                    );
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : step == 2 ? (
        <div
          key={step}
          className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]"
        >
          <img
            className="flex-none w-[140px] md:w-[260px]"
            src="/images/team.svg"
          />
          <div className="flex flex-col gap-6 md:gap-[42px] w-full">
            <div className="flex flex-col gap-4 md:gap-[30px]">
              <div className="flex-grow md:flex-1 flex flex-col gap-4 md:gap-[30px]">
                <div className="flex flex-col gap-3 md:gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Build Your Team"
                    description="Add yourself as the maintainer and optionally include team members to collaborate on your project."
                  />
                </div>
                <div className="flex flex-col gap-[18px]">
                  {maintainerAddresses.map((address, i) => (
                    <div key={i} className="flex flex-col gap-2 w-full">
                      <div className="flex flex-col md:flex-row gap-[18px]">
                        <Input
                          className="flex-1"
                          value={address}
                          {...(i == 0 && {
                            label: "Maintainer Wallet Address",
                          })}
                          placeholder="G..."
                          onChange={(e) => {
                            setMaintainerAddresses(
                              maintainerAddresses.map((addr, j) =>
                                i == j ? e.target.value : addr,
                              ),
                            );
                            setMaintainersErrors(
                              maintainersErrors.map((err, j) =>
                                i === j ? null : err,
                              ),
                            );
                          }}
                          error={maintainersErrors[i]}
                        />
                        <Input
                          className="flex-1"
                          value={maintainerGithubs[i] ?? ""}
                          {...(i == 0 && { label: "GitHub Handle" })}
                          placeholder="username"
                          onChange={(e) => {
                            setMaintainerGithubs(
                              maintainerGithubs.map((gh, j) =>
                                i == j ? e.target.value : gh,
                              ),
                            );
                            setGithubHandleErrors(
                              githubHandleErrors.map(
                                (err: string | null, j: number) =>
                                  i === j ? null : err,
                              ),
                            );
                          }}
                          error={githubHandleErrors[i]}
                        />
                        {i > 0 && (
                          <button
                            onClick={() => {
                              setMaintainerAddresses(
                                maintainerAddresses.filter((_, j) => j !== i),
                              );
                              setMaintainerGithubs(
                                maintainerGithubs.filter((_, j) => j !== i),
                              );
                              setMaintainersErrors(
                                maintainersErrors.filter((_, j) => j !== i),
                              );
                              setGithubHandleErrors(
                                githubHandleErrors.filter((_, j) => j !== i),
                              );
                            }}
                          >
                            <img src="/icons/remove.svg" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      type="tertiary"
                      icon="/icons/plus.svg"
                      onClick={() => {
                        setMaintainerAddresses([...maintainerAddresses, ""]);
                        setMaintainerGithubs([...maintainerGithubs, ""]);
                        setMaintainersErrors([...maintainersErrors, null]);
                        setGithubHandleErrors([...githubHandleErrors, null]);
                      }}
                    >
                      Add Maintainer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-[18px]">
              <Button
                type="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const isValid = validateMaintainers();
                  if (isValid) {
                    setStep(step + 1);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : step == 3 ? (
        <div
          key={step}
          className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]"
        >
          <img
            className="flex-none w-[140px] md:w-[260px]"
            src="/images/arrow.svg"
          />
          <div className="flex flex-col gap-6 md:gap-[42px] w-full">
            <div className="flex flex-col gap-4 md:gap-[30px]">
              <div className="flex-grow md:flex-1 flex flex-col gap-4 md:gap-[30px]">
                <div className="flex flex-col gap-3 md:gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Add Supporting Materials"
                    description="Attach links to provide more context and strengthen your project proposal."
                  />
                </div>
                <div className="flex flex-col gap-[30px]">
                  <Input
                    label="Organization Name"
                    placeholder="Your organisation / project owner name"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgNameError(null);
                    }}
                    error={orgNameError}
                  />

                  <Input
                    label="Organization Website URL"
                    placeholder="https://example.com"
                    value={orgUrl}
                    onChange={(e) => {
                      setOrgUrl(e.target.value);
                      setOrgUrlError(null);
                    }}
                    error={orgUrlError}
                  />

                  <Input
                    label="Organization Logo URL"
                    placeholder="https://.../logo.png"
                    value={orgLogo}
                    onChange={(e) => {
                      setOrgLogo(e.target.value);
                      setOrgLogoError(null);
                    }}
                    error={orgLogoError}
                  />

                  <Textarea
                    label="Project Description"
                    placeholder="Describe your project (min 3 words)"
                    value={orgDescription}
                    onChange={(e) => {
                      setOrgDescription(e.target.value);
                      setOrgDescriptionError(null);
                    }}
                    error={orgDescriptionError}
                  />

                  <Input
                    label="GitHub Repository URL"
                    placeholder="Write the github repository URL"
                    value={githubRepoUrl}
                    onChange={(e) => {
                      setGithubRepoUrl(e.target.value);
                      setGithubRepoUrlError(null); // Clear error when typing
                    }}
                    error={githubRepoUrlError}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-[18px]">
              <Button
                type="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const isGithubUrlValid = validateGithubRepoUrl();
                  const areOrgFieldsValid = validateOrgFields();

                  if (isGithubUrlValid && areOrgFieldsValid) {
                    setStep(step + 1);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : step == 4 ? (
        <div key={step} className="flex flex-col gap-[30px]">
          <div className="flex items-center gap-[18px]">
            <img className="flex-none w-[360px]" src="/images/note.svg" />
            <div className="flex-grow flex flex-col gap-[30px]">
              <div className="flex flex-col gap-5">
                <Step step={step} totalSteps={5} />
                <Title
                  title="Review and Submit Your Project"
                  description="Take a moment to review your project details before submitting. You can go back and make changes if needed."
                />
              </div>
              <div className="flex gap-[18px]">
                <Button
                  id="register-project-button"
                  isLoading={isLoading}
                  onClick={handleRegisterProject}
                >
                  Register Project
                </Button>
                <Button type="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <p className="leading-6 text-xl font-medium text-primary">
                First Step
              </p>
              <Button
                type="secondary"
                size="sm"
                className="p-[2px_10px]"
                onClick={() => setStep(1)}
              >
                Back to the First Step
              </Button>
            </div>
            <Label label="Project Name (On-chain)">
              <p className="leading-6 text-xl text-primary">{projectName}.xlm</p>
            </Label>
            {projectFullName && (
              <Label label="Project Full Name">
                <p className="leading-6 text-xl text-primary">{projectFullName}</p>
              </Label>
            )}
          </div>
          <div className="h-[1px] bg-[#ECE3F4]" />
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <p className="leading-6 text-xl font-medium text-primary">
                Second Step
              </p>
              <Button
                type="secondary"
                size="sm"
                className="p-[2px_10px]"
                onClick={() => setStep(2)}
              >
                Back to the Second Step
              </Button>
            </div>
            <Label label="Maintainers">
              <div className="grid grid-cols-3 gap-x-9 gap-y-[18px]">
                {maintainerAddresses.map((address, index) => (
                  <p
                    key={index}
                    className="leading-[14px] text-sm text-secondary"
                  >
                    {`(${address.slice(0, 24) + "..."})`}
                  </p>
                ))}
              </div>
            </Label>
          </div>
          <div className="h-[1px] bg-[#ECE3F4]" />
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <p className="leading-6 text-xl font-medium text-primary">
                Third Step
              </p>
              <Button
                type="secondary"
                size="sm"
                className="p-[2px_10px]"
                onClick={() => setStep(3)}
              >
                Back to the Third Step
              </Button>
            </div>
            <Label label="GitHub Repository URL">
              <p className="leading-6 text-xl text-primary">{githubRepoUrl}</p>
            </Label>
          </div>
        </div>
      ) : null}
    </FlowProgressModal>
  );
};

export default CreateProjectModal;
