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
import { extractConfigData, isValidGithubUrl, toast } from "utils/utils";

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

  // Verify domain contract ID on mount
  useEffect(() => {
    console.log("Using domain contract ID:", domainContractId);
    // Ensure it's a valid Stellar address format
    if (!/^[A-Z0-9]{56}$/.test(domainContractId)) {
      console.warn(
        "Domain contract ID appears to be invalid:",
        domainContractId,
      );
    }
  }, [domainContractId]);

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
      console.log(
        "Non-critical error during project name validation:",
        err.message,
      );
      return true;
    }

    // If we get here, project exists but the name doesn't match exactly
    return true;
  }, [projectName]);

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
          console.error("Error fetching project hash:", error);
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
      console.error("Project registration error:", err);
      toast.error("Something Went Wrong!", err.message);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {step == 1 ? (
        <div key={step} className="flex items-center gap-[18px]">
          <img className="flex-none w-[360px]" src="/images/megaphone.svg" />
          <div className="flex flex-col gap-[42px]">
            <div className="flex flex-col gap-[30px]">
              <div className="flex-grow flex flex-col gap-[30px]">
                <div className="flex flex-col gap-5">
                  <Step step={step} totalSteps={5} />
                  <Title
                    title="Welcome to Your New Project!"
                    description="Add your project's name, slogan, and description to showcase its goals."
                  />
                </div>
                <Input
                  label="Project Name"
                  placeholder="Write the name"
                  value={projectName}
                  onChange={(e) => {
                    // Only allow lowercase letters a-z
                    const validInput = e.target.value.replace(/[^a-z]/g, "");
                    setProjectName(validInput);
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-[18px]">
              <Button type="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                isLoading={isLoading}
                onClick={async () => {
                  if (!projectName.trim()) {
                    toast.error("Project Name", "Project name cannot be empty");
                    return;
                  }

                  setIsLoading(true);
                  try {
                    // Perform validation
                    await validateProjectName();
                    // If we got here, validation passed
                    setStep(step + 1);
                  } catch (err: any) {
                    console.error("Project name validation error:", err);
                    toast.error(
                      "Project Name",
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
        <div key={step} className="flex items-center gap-[18px]">
          <img className="flex-none w-[360px]" src="/images/team.svg" />
          <div className="flex flex-col gap-[42px]">
            <div className="flex flex-col gap-[30px]">
              <div className="flex-grow flex flex-col gap-[30px]">
                <div className="flex flex-col gap-5">
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
                        }}
                      />
                      {i > 0 && (
                        <button
                          onClick={() =>
                            setMaintainers(maintainers.filter((_, j) => j != i))
                          }
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
                      onClick={() => setMaintainers([...maintainers, ""])}
                    >
                      Add Maintainer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-[18px]">
              <Button type="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!maintainers.join(",").trim()) {
                    toast.error("Maintainers", "Maintainers cannot be empty");
                    return;
                  }

                  if (
                    maintainers.some(
                      (address) =>
                        !address.startsWith("G") || address.length != 56,
                    )
                  ) {
                    toast.error(
                      "Maintainers",
                      "Invalid maintainer address(es). Each address should start with 'G' and be 56 characters long.",
                    );
                    return;
                  }

                  setStep(step + 1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : step == 3 ? (
        <div key={step} className="flex items-center gap-[18px]">
          <img className="flex-none w-[360px]" src="/images/arrow.svg" />
          <div className="flex flex-col gap-[42px]">
            <div className="flex flex-col gap-[30px]">
              <div className="flex-grow flex flex-col gap-[30px]">
                <div className="flex flex-col gap-5">
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
                    onChange={(e) => setInfoFileHash(e.target.value)}
                  />
                  <Input
                    label="GitHub Repository URL"
                    placeholder="Write the github repository URL"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-[18px]">
              <Button type="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!isValidGithubUrl(githubRepoUrl)) {
                    toast.error("Github URL", "Invalid GitHub repository URL");
                    return;
                  }

                  if (infoFileHash.length !== 64) {
                    toast.error(
                      "File Hash",
                      "File hash must be 64 characters long",
                    );
                    return;
                  }

                  setStep(step + 1);
                }}
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
                <Button type="secondary" onClick={() => setStep(step - 1)}>
                  Back
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
            {/* <Button
              type="secondary"
              icon="/icons/share.svg"
              onClick={() => window.open()}
            >
              Share
            </Button> */}
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
