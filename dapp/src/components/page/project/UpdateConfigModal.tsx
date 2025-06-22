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
          id="update-config-button"
          className="p-[12px_16px] sm:p-[18px_30px] flex gap-2 sm:gap-3 bg-white cursor-pointer w-full sm:w-auto text-left"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/gear.svg" className="w-5 h-5 sm:w-auto sm:h-auto" />
          <p className="leading-5 text-base sm:text-xl text-primary whitespace-nowrap">
            Update config
          </p>
        </button>
      )}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/scan.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
              <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                Update config
              </h6>
              <div className="flex flex-col gap-4 sm:gap-[18px]">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Maintainers
                  </p>
                  <input
                    type="text"
                    className="p-3 sm:p-[18px] border border-[#978AA1] outline-none w-full text-sm sm:text-base"
                    placeholder="List of maintainers' addresses as G...,G..."
                    value={maintainers}
                    onChange={(e) => setMaintainers(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    GitHub repository URL
                  </p>
                  <input
                    type="url"
                    className="p-3 sm:p-[18px] border border-[#978AA1] outline-none w-full text-sm sm:text-base"
                    placeholder="GitHub repository URL"
                    value={configUrl}
                    onChange={(e) => setConfigUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Information file hash
                  </p>
                  <input
                    type="text"
                    className="p-3 sm:p-[18px] border border-[#978AA1] outline-none w-full text-sm sm:text-base"
                    placeholder="Information file hash"
                    value={configHash}
                    onChange={(e) => setConfigHash(e.target.value)}
                    required
                    minLength={64}
                    maxLength={64}
                  />
                </div>
                <div className="flex justify-end mt-2 sm:mt-0">
                  <Button
                    onClick={handleUpdate}
                    isLoading={isLoading}
                    className="w-full sm:w-auto"
                  >
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
