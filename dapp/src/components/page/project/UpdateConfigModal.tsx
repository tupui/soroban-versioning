import { useStore } from "@nanostores/react";
import { getProject } from "@service/ReadContractService";
import { loadProjectInfo, setProject } from "@service/StateService";
import { loadedPublicKey } from "@service/walletService";
import { updateConfig } from "@service/WriteContractService";
import Button from "components/utils/Button";
import Modal from "components/utils/Modal";
import { useEffect, useState } from "react";
import { projectInfoLoaded } from "utils/store";
import { toast } from "utils/utils";

const UpdateConfigModal = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [showButton, setShowButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [maintainers, setMaintainers] = useState("");
  const [configUrl, setConfigUrl] = useState("");
  const [configHash, setConfigHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();

      setMaintainers(projectInfo?.maintainers.join(",") || "");
      setConfigUrl(projectInfo?.config.url || "");
      setConfigHash(projectInfo?.config.hash || "");

      if (projectInfo) {
        const connectedPublicKey = loadedPublicKey();
        const isMaintainer = connectedPublicKey
          ? projectInfo.maintainers.includes(connectedPublicKey)
          : false;
        setShowButton(isMaintainer);
      }
    }
  }, [isProjectInfoLoaded]);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await updateConfig(maintainers, configUrl, configHash);
      try {
        const project = await getProject();
        if (project && project.name && project.config && project.maintainers) {
          setProject(project);
        }
        setIsOpen(false);
      } catch (error) {
        console.error("Error updating config:", error);
        toast.error(
          "Update config",
          "An error occurred while updating the project configuration. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Error updating config:", error);
      toast.error("Update config", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showButton && (
        <button
          className="p-[18px_30px] flex gap-3 bg-white cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/gear.svg" />
          <p className="leading-5 text-xl text-primary">Update config</p>
        </button>
      )}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className="flex items-start gap-[18px]">
            <img src="/images/scan.svg" />
            <div className="flex-grow flex flex-col gap-9">
              <h6 className="text-2xl font-medium text-primary">
                Update config
              </h6>
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">
                    Maintainers
                  </p>
                  <input
                    type="text"
                    className="p-[18px] border border-[#978AA1] outline-none"
                    placeholder="List of maintainers' addresses as G...,G..."
                    value={maintainers}
                    onChange={(e) => setMaintainers(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">
                    GitHub repository URL
                  </p>
                  <input
                    type="url"
                    className="p-[18px] border border-[#978AA1] outline-none"
                    placeholder="GitHub repository URL"
                    value={configUrl}
                    onChange={(e) => setConfigUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">
                    Information file hash
                  </p>
                  <input
                    type="text"
                    className="p-[18px] border border-[#978AA1] outline-none"
                    placeholder="Information file hash"
                    value={configHash}
                    onChange={(e) => setConfigHash(e.target.value)}
                    required
                    minLength={64}
                    maxLength={64}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleUpdate} isLoading={isLoading}>
                    Update Config
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default UpdateConfigModal;
