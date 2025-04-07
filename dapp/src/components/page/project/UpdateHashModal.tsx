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
          className="p-[18px_30px] flex gap-3 bg-white cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/gear.svg" />
          <p className="leading-5 text-xl text-primary">Update Hash</p>
        </button>
      )}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className="flex items-start gap-[18px]">
            <img src="/images/scan.svg" />
            <div className="flex-grow flex flex-col gap-9">
              <h6 className="text-2xl font-medium text-primary">
                Update Commit Hash
              </h6>
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">
                    Latest Hash
                  </p>
                  <input
                    type="text"
                    className="p-[18px] border border-[#978AA1] outline-none"
                    placeholder="Lastest Commit Hash"
                    value={lastestHash}
                    onChange={(e) => setLatestHash(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleUpdate} isLoading={isLoading}>
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
