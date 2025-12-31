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
import { useState, type FC, useCallback, useEffect } from "react";
import { getAuthorRepo } from "utils/editLinkFunctions";
import { extractConfigData, toast } from "utils/utils";
import {
  validateProjectName as validateProjectNameUtil,
  validateGithubUrl,
  validateMaintainerAddress,
} from "utils/validations.ts";
import Textarea from "components/utils/Textarea.tsx";
import Spinner from "components/utils/Spinner.tsx";
import { ProjectType } from "types/projectConfig";

// Get domain contract ID from environment with fallback
const SOROBAN_DOMAIN_CONTRACT_ID =
  import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID ||
  "CAXOTRU4DBR736ZG4E7VBFKGVCCHG6FOH7HFXMB3BH27VUKPHOJWO3XM"; // Fallback value

// Define ModalProps type for the modal component
type ModalProps = {
  onClose: () => void;
};

const CreateProjectModal: FC<ModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.SOFTWARE);
  const [maintainerAddresses, setMaintainerAddresses] = useState<string[]>([
    loadedPublicKey() || "",
  ]);

  const [maintainerGithubs, setMaintainerGithubs] = useState<string[]>([""]);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [domainContractId] = useState(SOROBAN_DOMAIN_CONTRACT_ID);
  const [domainStatus, setDomainStatus] = useState<
    "checking" | "available" | "unavailable" | null
  >(null);
  const [domainCheckTimeout, setDomainCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Form validation errors
  const [projectNameError, setProjectNameError] = useState<string | null>(null);
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

  // Verify domain contract ID on mount
  useEffect(() => {
    // Ensure it's a valid Stellar address format
    if (!/^[A-Z0-9]{56}$/.test(domainContractId)) {
      // Silent validation, don't log anything
    }
  }, [domainContractId]);

  // Function to check if a domain exists
  const checkDomainExists = async (domain: string): Promise<boolean> => {
    try {
      // Try to get the project with this name - if it exists, the domain is taken
      const project = await getProjectFromName(domain);
      return !!project && project.name === domain;
    } catch (error: any) {
      // If we get a specific error that indicates the project doesn't exist, return false
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
      // Re-throw other errors
      throw error;
    }
  };

  const validateProjectName = useCallback(async () => {
    if (!projectName.trim()) {
      throw new Error("Project name cannot be empty");
    }

    if (projectName.length < 4 || projectName.length > 15) {
      throw new Error("The length of project name should be between 4 and 15.");
    }

    if (!/^[a-z]+$/.test(projectName)) {
      throw new Error("Project name can only contain lowercase letters (a-z)");
    }

    // Check domain availability
    try {
      const domainExists = await checkDomainExists(projectName);
      if (domainExists) {
        throw new Error("Domain name already registered");
      }
    } catch (err: any) {
      // Only re-throw if it's our custom "already registered" error
      if (err.message && err.message.includes("already registered")) {
        throw err;
      }
      // For other errors, silently continue
    }

    try {
      // First check in a try/catch to protect against non-existent projects
      const project = await getProjectFromName(projectName);

      // If we reach here, the project exists
      if (project && project.name === projectName) {
        throw new Error("Project name already registered");
      }
    } catch (err: any) {
      // Check if it's a specific error that indicates the project doesn't exist
      if (
        err.message &&
        (err.message.includes("No project defined") ||
          err.message.includes("not found") ||
          err.message.includes("record not found") ||
          err.message.includes("Invalid Key"))
      ) {
        // This means the project doesn't exist, which is what we want
        return true;
      } else if (err.message && err.message.includes("already registered")) {
        // Re-throw specific errors about project already being registered
        throw err;
      }
      // For any other errors, assume it's safe to proceed
      return true;
    }

    // If we get here, project exists but the name doesn't match exactly
    return true;
  }, [projectName]);

  // Update maintainersErrors array when maintainers change
  useEffect(() => {
    setMaintainersErrors(maintainerAddresses.map(() => null));
    setGithubHandleErrors(maintainerGithubs.map(() => null));
  }, [maintainerAddresses.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (domainCheckTimeout) {
        clearTimeout(domainCheckTimeout);
      }
    };
  }, [domainCheckTimeout]);

  // Check domain availability with debounce
  useEffect(() => {
    if (!projectName || projectName.length < 4) {
      setDomainStatus(null);
      return;
    }

    setDomainStatus("checking");

    // Clear previous timeout if it exists
    if (domainCheckTimeout) {
      clearTimeout(domainCheckTimeout);
    }

    // Set a new timeout to check domain availability
    const timeout = setTimeout(async () => {
      try {
        // Use the validateProjectName function to check availability
        await validateProjectName();
        // If we get here without an error, the domain is available
        setDomainStatus("available");
      } catch (error: any) {
        // If the error message contains "already registered", the domain is unavailable
        if (
          error.message &&
          (error.message.includes("already registered") ||
            error.message.includes("Project name already registered"))
        ) {
          setDomainStatus("unavailable");
        } else {
          // Silently handle other errors
          setDomainStatus(null);
        }
      }
    }, 1000); // 1000ms (1 second) debounce

    setDomainCheckTimeout(timeout);

    // Cleanup on unmount
    return () => {
      if (domainCheckTimeout) {
        clearTimeout(domainCheckTimeout);
      }
    };
  }, [projectName, validateProjectName]);

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
        return "Handle is required";
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

      // ── Build TOML content ───────────────────────────────────────────────
      const tomlContent = `VERSION="2.0.0"
PROJECT_TYPE="${projectType}"

ACCOUNTS=[
${maintainerAddresses.map((a) => `    "${a}"`).join(",\n")}
]

[DOCUMENTATION]
ORG_NAME="${orgName}"
ORG_URL="${orgUrl}"
ORG_LOGO="${orgLogo}"
ORG_DESCRIPTION="${orgDescription}"${projectType === ProjectType.SOFTWARE ? `\nORG_GITHUB="${githubRepoUrl.split("https://github.com/")[1] || ""}"` : ""}

${maintainerGithubs.map((gh) => `[[PRINCIPALS]]\nhandle="${gh}"`).join("\n\n")}
`;

      const tomlFile = new File([tomlContent], "tansu.toml", {
        type: "text/plain",
      });

      // Create README file for non-software projects
      let additionalFiles: File[] | undefined = undefined;
      if (projectType === ProjectType.GENERIC && readmeContent) {
        const readmeFile = new File([readmeContent], "README.md", {
          type: "text/plain",
        });
        additionalFiles = [readmeFile];
      }

      // show progress
      setStep(6);

      const { createProjectFlow } = await import("@service/FlowService");

      await createProjectFlow({
        projectName,
        tomlFile,
        githubRepoUrl: projectType === ProjectType.SOFTWARE ? githubRepoUrl : "",
        maintainers: maintainerAddresses,
        onProgress: setStep,
        ...(additionalFiles && { additionalFiles }),
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
    try {
      // First check basic validation
      const nameError = validateProjectNameUtil(projectName);
      if (nameError) {
        setProjectNameError(nameError);
        return false;
      }

      // Check domain availability
      try {
        const domainExists = await checkDomainExists(projectName);
        if (domainExists) {
          setProjectNameError("Domain name already registered");
          return false;
        }
      } catch (err: any) {
        if (err.message && err.message.includes("already registered")) {
          setProjectNameError("Domain name already registered");
          return false;
        }
      }

      setProjectNameError(null);
      return true;
    } catch (error: any) {
      setProjectNameError(error.message || "Invalid project name");
      return false;
    }
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
                    description="Add your project's name, slogan, and description to showcase its goals."
                  />
                </div>
                <div className="relative">
                  <Input
                    label="Project Name"
                    placeholder="Write the name"
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
                        ? "Project name can only contain lowercase letters (a-z)"
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
                <div className="flex flex-col gap-3">
                  <Label label="Project Type" />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="projectType"
                        value={ProjectType.SOFTWARE}
                        checked={projectType === ProjectType.SOFTWARE}
                        onChange={() => setProjectType(ProjectType.SOFTWARE)}
                        className="w-4 h-4"
                      />
                      <span className="text-primary">Software Project (uses Git/GitHub)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="projectType"
                        value={ProjectType.GENERIC}
                        checked={projectType === ProjectType.GENERIC}
                        onChange={() => setProjectType(ProjectType.GENERIC)}
                        className="w-4 h-4"
                      />
                      <span className="text-primary">Non-Software Project</span>
                    </label>
                  </div>
                  <p className="text-sm text-secondary">
                    {projectType === ProjectType.SOFTWARE
                      ? "For software projects with Git history and GitHub integration"
                      : "For non-software projects like creative work, documentation, or community initiatives"}
                  </p>
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
                isLoading={isLoading}
                className="w-full sm:w-auto"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    // Perform validation directly in the click handler
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
                          {...(i == 0 && { label: projectType === ProjectType.SOFTWARE ? "GitHub Handle" : "Handle" })}
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

                  {projectType === ProjectType.SOFTWARE ? (
                    <Input
                      label="GitHub Repository URL"
                      placeholder="Write the github repository URL"
                      value={githubRepoUrl}
                      onChange={(e) => {
                        setGithubRepoUrl(e.target.value);
                        setGithubRepoUrlError(null);
                      }}
                      error={githubRepoUrlError}
                    />
                  ) : (
                    <Textarea
                      label="README Content"
                      placeholder="Write your project README in markdown format..."
                      value={readmeContent}
                      onChange={(e) => {
                        setReadmeContent(e.target.value);
                      }}
                      description="Provide documentation for your non-software project. Markdown formatting is supported."
                    />
                  )}
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
                  // Only validate GitHub URL for software projects
                  const isGithubUrlValid = projectType === ProjectType.SOFTWARE
                    ? validateGithubRepoUrl()
                    : true;
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
            <Label label="Project name">
              <p className="leading-6 text-xl text-primary">{projectName}</p>
            </Label>
            <Label label="Project type">
              <p className="leading-6 text-xl text-primary">
                {projectType === ProjectType.SOFTWARE ? "Software Project" : "Non-Software Project"}
              </p>
            </Label>
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
