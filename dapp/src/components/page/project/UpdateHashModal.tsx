import { useStore } from "@nanostores/react";
import { getLatestCommitHash } from "@service/GithubService";
import { getProject } from "@service/ReadContractService";
import { loadProjectInfo, setProject } from "@service/StateService";
import { loadedPublicKey } from "@service/walletService";
import { commitHash } from "@service/ContractService";
import Button from "components/utils/Button";
import Modal from "components/utils/Modal";
import { useEffect, useState } from "react";
import { projectInfoLoaded } from "utils/store";
import { toast } from "utils/utils";

const UpdateHashModal = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [showButton, setShowButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastestHash, setLatestHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccessful, setUpdateSuccessful] = useState(false);
  useEffect(() => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();

      if (projectInfo) {
        getLatestCommitHash(projectInfo?.config.url || "")
          .then((latestSha) => {
            setLatestHash(latestSha || "");
          })
          .catch((_error: any) => {
            // Silently handle errors
          });
        const connectedPublicKey = loadedPublicKey();
        const isMaintainer = connectedPublicKey
          ? projectInfo.maintainers.includes(connectedPublicKey)
          : false;
        setShowButton(isMaintainer);
      }
    }
  }, [isProjectInfoLoaded]);

  const handleClose = () => {
    setIsOpen(false);
    setUpdateSuccessful(false);
    // Reload page if update was successful to show fresh data
    if (updateSuccessful) {
      window.location.reload();
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await commitHash(lastestHash);

      // Successfully updated - refresh project data and reload the page
      try {
        const project = await getProject();
        if (project && project.name && project.config && project.maintainers) {
          setProject(project);
        }
      } catch (refreshError) {
        if (import.meta.env.DEV)
          console.error("Error refreshing project data:", refreshError);
        // Don't show error to user as the update was successful
      }

      toast.success(
        "Commit Hash Updated",
        "Project commit hash has been successfully updated.",
      );
      setUpdateSuccessful(true);
      // Don't close modal immediately - let user close it manually
    } catch (error: any) {
      if (import.meta.env.DEV)
        console.error("Error updating Commit Hash:", error);
      toast.error(
        "Update Commit Hash",
        error.message || "Failed to update commit hash. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showButton && (
        <button
          id="commit-button"
          className="px-4 py-3 sm:px-6 sm:py-4 flex gap-2 items-center bg-white cursor-pointer w-full sm:w-auto text-left border border-gray-200 hover:bg-gray-50 transition-colors rounded-md"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/git.svg" className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm sm:text-base text-primary font-medium">
            Update Hash
          </span>
        </button>
      )}
      {isOpen && (
        <Modal onClose={handleClose}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/scan.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
              <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                Update Commit Hash
              </h6>
              <div className="flex flex-col gap-6 sm:gap-10">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Latest Hash
                  </p>
                  <input
                    type="text"
                    className="p-3 sm:p-[18px] border border-[#978AA1] outline-none w-full text-sm sm:text-base"
                    placeholder="Latest Commit Hash"
                    value={lastestHash}
                    onChange={(e) => setLatestHash(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end mt-2 sm:mt-0">
                  <Button
                    onClick={handleUpdate}
                    isLoading={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Update Hash
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

export default UpdateHashModal;
