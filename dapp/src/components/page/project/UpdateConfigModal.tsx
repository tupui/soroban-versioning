import { useStore } from "@nanostores/react";
import {
  loadProjectInfo,
  loadConfigData,
  setConfigData,
  setProject,
} from "@service/StateService";
import { projectInfoLoaded } from "utils/store";
import { useEffect, useState } from "react";
import Modal from "components/utils/Modal";
import Button from "components/utils/Button";
import Input from "components/utils/Input";
import Textarea from "components/utils/Textarea";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import {
  validateMaintainerAddress,
  validateGithubUrl,
} from "utils/validations";
import { updateConfigFlow } from "@service/FlowService";
import { toast, extractConfigData } from "utils/utils";
import { getProject } from "@service/ReadContractService";
import { calculateDirectoryCid } from "utils/ipfsFunctions";
import ProgressStep from "components/utils/ProgressStep";

const UpdateConfigModal = () => {
  const infoLoaded = useStore(projectInfoLoaded);
  const [showButton, setShowButton] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // fields
  const [maintainerAddresses, setMaintainerAddresses] = useState<string[]>([
    "",
  ]);
  const [maintainerGithubs, setMaintainerGithubs] = useState<string[]>([""]);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  // errors
  const [addrErrors, setAddrErrors] = useState<(string | null)[]>([null]);
  const [ghErrors, setGhErrors] = useState<(string | null)[]>([null]);
  const [repoError, setRepoError] = useState<string | null>(null);

  // pre-fill from current config
  useEffect(() => {
    if (!infoLoaded) return;
    const projectInfo = loadProjectInfo();
    const cfg = loadConfigData();
    if (!projectInfo || !projectInfo.maintainers || !projectInfo.config) return;
    setMaintainerAddresses(projectInfo.maintainers);
    setMaintainerGithubs(
      cfg?.authorGithubNames || projectInfo.maintainers.map(() => ""),
    );
    setGithubRepoUrl(projectInfo.config.url);
    setOrgName(cfg?.organizationName || "");
    setOrgUrl(cfg?.officials?.websiteLink || "");
    setOrgLogo(cfg?.logoImageLink || "");
    setOrgDescription(cfg?.description || "");
    setAddrErrors(projectInfo.maintainers.map(() => null));
    setGhErrors(projectInfo.maintainers.map(() => null));

    // show button only if wallet is maintainer handled outside earlier
    setShowButton(true);
  }, [infoLoaded]);

  // validation helpers
  const ghRegex = /^[A-Za-z0-9_-]{1,30}$/;
  const validateMaintainers = () => {
    let ok = true;
    const newAddrErr = maintainerAddresses.map((a) => {
      const e = validateMaintainerAddress(a);
      if (e) ok = false;
      return e;
    });
    const newGhErr = maintainerGithubs.map((h) => {
      if (!h.trim()) {
        ok = false;
        return "required";
      }
      if (!ghRegex.test(h)) {
        ok = false;
        return "invalid";
      }
      return null;
    });
    setAddrErrors(newAddrErr);
    setGhErrors(newGhErr);
    return ok;
  };
  const validateRepo = () => {
    const e = validateGithubUrl(githubRepoUrl);
    setRepoError(e);
    return e === null;
  };

  // build TOML
  const buildToml = (): string => {
    return `VERSION="2.0.0"
\nACCOUNTS=[\n${maintainerAddresses.map((a) => `    "${a}"`).join(",\n")}\n]\n\n[DOCUMENTATION]\nORG_NAME="${orgName}"\nORG_URL="${orgUrl}"\nORG_LOGO="${orgLogo}"\nORG_DESCRIPTION="${orgDescription}"\nORG_GITHUB="${githubRepoUrl.split("https://github.com/")[1] || ""}"\n\n${maintainerGithubs.map((gh) => `[[PRINCIPALS]]\ngithub="${gh}"`).join("\n\n")}\n`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const tomlContent = buildToml();
      const tomlFile = new File([tomlContent], "tansu.toml", {
        type: "text/plain",
      });
      await updateConfigFlow({
        tomlFile,
        githubRepoUrl,
        maintainers: maintainerAddresses,
        onProgress: setStep,
      });
      // refresh state
      const p = await getProject();
      if (p) setProject(p);
      const cid = await calculateDirectoryCid([tomlFile]);
      const configData = extractConfigData(JSON.parse("{}"), p as any); // placeholder parse later
      setConfigData(configData);
      toast.success(
        "Config updated",
        "Project configuration updated successfully",
      );
      setOpen(false);
    } catch (e: any) {
      toast.error("Update config", e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // render
  if (!showButton) return null;
  return (
    <>
      <button
        className="p-[12px_16px] sm:p-[18px_30px] bg-white"
        onClick={() => setOpen(true)}
      >
        Update config
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          {step <= 3 && (
            <div className="flex flex-col gap-8">
              {step === 1 && (
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]">
                  <img
                    className="flex-none md:w-1/3 w-[180px]"
                    src="/images/team.svg"
                  />
                  <div className="flex flex-col gap-4 w-full md:w-2/3">
                    <Step step={1} totalSteps={3} />
                    <Title
                      title="Maintainers"
                      description="Edit maintainer addresses & GitHub handles"
                    />
                    {maintainerAddresses.map((addr, i) => (
                      <div key={i} className="flex gap-3 mb-3">
                        <Input
                          value={addr ?? ""}
                          error={addrErrors[i] || undefined}
                          onChange={(e) => {
                            const v = [...maintainerAddresses];
                            v[i] = e.target.value;
                            setMaintainerAddresses(v);
                          }}
                        />
                        <Input
                          value={maintainerGithubs[i] ?? ""}
                          error={ghErrors[i] || undefined}
                          onChange={(e) => {
                            const v = [...maintainerGithubs];
                            v[i] = e.target.value;
                            setMaintainerGithubs(v);
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="tertiary"
                      onClick={() => {
                        setMaintainerAddresses([...maintainerAddresses, ""]);
                        setMaintainerGithubs([...maintainerGithubs, ""]);
                        setAddrErrors([...addrErrors, null]);
                        setGhErrors([...ghErrors, null]);
                      }}
                    >
                      Add Maintainer
                    </Button>
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={() => {
                          if (validateMaintainers()) setStep(2);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]">
                  <img
                    className="flex-none md:w-1/3 w-[180px]"
                    src="/images/arrow.svg"
                  />
                  <div className="flex flex-col gap-4 w-full md:w-2/3">
                    <Step step={2} totalSteps={3} />
                    <Title
                      title="Project details"
                      description="Organisation & repository"
                    />
                    <Input
                      label="Organisation name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                    <Input
                      label="Organisation URL"
                      value={orgUrl}
                      onChange={(e) => setOrgUrl(e.target.value)}
                    />
                    <Input
                      label="Logo URL"
                      value={orgLogo}
                      onChange={(e) => setOrgLogo(e.target.value)}
                    />
                    <Textarea
                      label="Description"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                    />
                    <Input
                      label="GitHub repository URL"
                      value={githubRepoUrl}
                      onChange={(e) => {
                        setGithubRepoUrl(e.target.value);
                        setRepoError(null);
                      }}
                      error={repoError || undefined}
                    />
                    <div className="flex justify-between mt-4">
                      <Button type="secondary" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (validateRepo()) setStep(3);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <Step step={3} totalSteps={3} />
                  <Title title="Review" description="Confirm and update" />
                  <p className="mb-4">
                    A new tansu.toml will be generated and stored on IPFS.
                  </p>
                  <div className="flex justify-between">
                    <Button type="secondary" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button isLoading={isLoading} onClick={handleSubmit}>
                      Update Config
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {step >= 4 && step <= 9 && <ProgressStep step={step - 4} />}
        </Modal>
      )}
    </>
  );
};

export default UpdateConfigModal;
