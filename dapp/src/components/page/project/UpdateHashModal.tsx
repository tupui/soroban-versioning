import { useStore } from "@nanostores/react";
import { getLatestCommitHash } from "@service/GithubService";
import { getProject } from "@service/ReadContractService";
import { loadProjectInfo, setProject } from "@service/StateService";
import { loadedPublicKey } from "@service/walletService";
import { commitHash } from "@service/WriteContractService";
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

  useEffect(() => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();

      if (projectInfo) {
        try {
          getLatestCommitHash(projectInfo?.config.url || "").then(
            (latestSha) => {
              setLatestHash(latestSha || "");
            },
          );
        } catch (error: any) {
          toast.error("Something Went Wrong!", error.message);
        }
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
      await commitHash(lastestHash);
      try {
        const project = await getProject();
        if (project && project.name && project.config && project.maintainers) {
          setProject(project);
        }
        setIsOpen(false);
      } catch (error) {
        console.error("Error updating Commit Hash:", error);
        toast.error(
          "Update Commit Hash",
          "An error occurred while updating the project Commit Hash. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Error updating Commit Hash:", error);
      toast.error("Update Commit Hash", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showButton && (
        <button
          id="commit-button"
          className="p-[12px_16px] sm:p-[18px_30px] flex gap-2 sm:gap-3 bg-white cursor-pointer w-full sm:w-auto text-left"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/gear.svg" className="w-5 h-5 sm:w-auto sm:h-auto" />
          <p className="leading-5 text-base sm:text-xl text-primary whitespace-nowrap">
            Update Hash
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
