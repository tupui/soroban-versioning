import { fetchTOMLFromConfigUrl } from "@service/GithubService";
import {
  getProjectFromName,
  getProjectHash,
} from "@service/ReadContractService";
import {
  setConfigData,
  setProject,
  setProjectLatestSha,
  setProjectRepoInfo,
} from "@service/StateService";
import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Input from "components/utils/Input";
import Label from "components/utils/Label";
import Modal, { type ModalProps } from "components/utils/Modal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import { useState, type FC, useCallback, useEffect } from "react";
import { getAuthorRepo } from "utils/editLinkFunctions";
import { extractConfigData, toast } from "utils/utils";
import {
  validateStellarAddress,
  validateProjectName as validateProjectNameUtil,
  validateFileHash,
  validateGithubUrl,
  validateMaintainerAddress,
} from "utils/validations";

// Get domain contract ID from environment with fallback
const SOROBAN_DOMAIN_CONTRACT_ID =
  import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID ||
  "CCWXBS4ZFOC5QVY5AUEVFBSTOEKJUSB4JBULT6TRWDH4PPDOTVRV4UJM"; // Fallback value

const CreateProjectModal: FC<ModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [maintainers, setMaintainers] = useState<string[]>([""]);
  const [infoFileHash, setInfoFileHash] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [domainContractId, setDomainContractId] = useState(
    SOROBAN_DOMAIN_CONTRACT_ID,
  );
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
  const [infoFileHashError, setInfoFileHashError] = useState<string | null>(
    null,
  );
  const [githubRepoUrlError, setGithubRepoUrlError] = useState<string | null>(
    null,
  );

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
    setMaintainersErrors(maintainers.map(() => null));
  }, [maintainers.length]);

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
    const errors = maintainers.map((maintainer) => {
      const error = validateMaintainerAddress(maintainer);
      if (error) {
        isValid = false;
        return error;
      }
      return null;
    });

    setMaintainersErrors(errors);
    return isValid;
  };

  const validateInfoFileHash = () => {
    const error = validateFileHash(infoFileHash);
    setInfoFileHashError(error);
    return error === null;
  };

  const validateGithubRepoUrl = () => {
    const error = validateGithubUrl(githubRepoUrl);
    setGithubRepoUrlError(error);
    return error === null;
  };

  const handleRegisterProject = async () => {
    setIsLoading(true);
    const { registerProject } = await import("@service/WriteContractService");

    try {
      await registerProject(
        projectName,
        maintainers.join(","),
        githubRepoUrl,
        infoFileHash,
        domainContractId,
      );

      const project = await getProjectFromName(projectName);
      if (project && project.name && project.config && project.maintainers) {
        setProject(project);

        const { username, repoName } = getAuthorRepo(project.config.url);
        if (username && repoName) {
          setProjectRepoInfo(username, repoName);
        }

        const tomlData = await fetchTOMLFromConfigUrl(project.config.url);
        if (tomlData) {
          const configData = extractConfigData(tomlData, project);
          setConfigData(configData);
        } else {
          setConfigData({});
        }
        try {
          const latestSha = await getProjectHash();
          if (
            typeof latestSha === "string" &&
            latestSha.match(/^[a-f0-9]{40}$/)
          ) {
            setProjectLatestSha(latestSha);
          } else {
            setProjectLatestSha("");
            throw new Error("Invalid project hash");
          }
        } catch (error: any) {
          setProjectLatestSha("");
          toast.error("Something Went Wrong!", error.message);
        }
      }

      // Show success message
      toast.success("Success", "Project has been registered successfully!");

      // Close the modal
      onClose();

      // Navigate to the new project page
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

  return (
    <Modal onClose={onClose}>
      {step == 1 ? (
        <div
          key={step}
          className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]"
        >
          <img
            className="flex-none w-[200px] md:w-[360px]"
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
                        <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
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
            className="flex-none w-[200px] md:w-[360px]"
            src="/images/team.svg"
          />
          <div className="flex flex-col gap-6 md:gap-[42px] w-full">
            <div className="flex flex-col gap-4 md:gap-[30px]">
              <div className="flex-grow flex flex-col gap-4 md:gap-[30px]">
                <div className="flex flex-col gap-3 md:gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Build Your Team"
                    description="Add yourself as the maintainer and optionally include team members to collaborate on your project."
                  />
                </div>
                <div className="flex flex-col gap-[18px]">
                  {maintainers.map((maintainer, i) => (
                    <div key={i} className="flex gap-[18px]">
                      <Input
                        value={maintainer}
                        {...(i == 0 && { label: "First Maintainer" })}
                        placeholder="Write the maintainer's address as G..."
                        onChange={(e) => {
                          setMaintainers(
                            maintainers.map((maintainer, j) =>
                              i == j ? e.target.value : maintainer,
                            ),
                          );
                          // Clear error when typing
                          setMaintainersErrors(
                            maintainersErrors.map((error, j) =>
                              i === j ? null : error,
                            ),
                          );
                        }}
                        error={maintainersErrors[i]}
                      />
                      {i > 0 && (
                        <button
                          onClick={() => {
                            setMaintainers(
                              maintainers.filter((_, j) => j != i),
                            );
                            setMaintainersErrors(
                              maintainersErrors.filter((_, j) => j != i),
                            );
                          }}
                        >
                          <img src="/icons/remove.svg" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      type="tertiary"
                      icon="/icons/plus.svg"
                      onClick={() => {
                        setMaintainers([...maintainers, ""]);
                        setMaintainersErrors([...maintainersErrors, null]);
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
            className="flex-none w-[200px] md:w-[360px]"
            src="/images/arrow.svg"
          />
          <div className="flex flex-col gap-6 md:gap-[42px] w-full">
            <div className="flex flex-col gap-4 md:gap-[30px]">
              <div className="flex-grow flex flex-col gap-4 md:gap-[30px]">
                <div className="flex flex-col gap-3 md:gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Add Supporting Materials"
                    description="Attach links to provide more context and strengthen your project proposal."
                  />
                </div>
                <div className="flex flex-col gap-[30px]">
                  <Input
                    label="Information File Hash"
                    placeholder="Write the information file hash"
                    value={infoFileHash}
                    onChange={(e) => {
                      setInfoFileHash(e.target.value);
                      setInfoFileHashError(null); // Clear error when typing
                    }}
                    error={infoFileHashError}
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
                  const isInfoHashValid = validateInfoFileHash();
                  const isGithubUrlValid = validateGithubRepoUrl();

                  if (isInfoHashValid && isGithubUrlValid) {
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
                <Button isLoading={isLoading} onClick={handleRegisterProject}>
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
                {maintainers.map((maintainer, index) => (
                  <p
                    key={index}
                    className="leading-[14px] text-sm text-secondary"
                  >
                    {`(${maintainer.slice(0, 24) + "..."})`}
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
            <Label label="Information File Hash">
              <p className="leading-6 text-xl text-primary">{infoFileHash}</p>
            </Label>
            <Label label="GitHub Repository URL">
              <p className="leading-6 text-xl text-primary">{githubRepoUrl}</p>
            </Label>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[42px]">
          <div className="flex items-start gap-[18px]">
            <img className="flex-none w-[360px]" src="/images/flower.svg" />
            <div className="flex-grow flex flex-col gap-[30px]">
              <Step step={step} totalSteps={5} />
              <Title
                title="Your Project Is Live!"
                description="Congratulations! You've successfully created your project. Let's get the ball rolling!"
              />
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button onClick={() => navigate(`/project?name=${projectName}`)}>
              View Project
            </Button>
            <Button type="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateProjectModal;
