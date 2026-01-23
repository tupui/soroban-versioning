import { useStore } from "@nanostores/react";
import { loadProjectInfo } from "@service/StateService";
import { projectInfoLoaded } from "utils/store";
import { useEffect, useState } from "react";
import Button from "components/utils/Button";
import Input from "components/utils/Input";
import Modal from "components/utils/Modal";
import { toast } from "utils/utils";
import { deriveProjectKey } from "utils/projectKey";
import Tansu from "contracts/soroban_tansu";
import { checkSimulationError } from "utils/contractErrors";
import { loadedPublicKey } from "@service/walletService";
import {
  signAssembledTransaction,
  sendSignedTransaction,
} from "@service/TxService";
import { Buffer } from "buffer";

interface ManageSubProjectsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ManageSubProjectsModal: React.FC<ManageSubProjectsModalProps> = ({
  isOpen: _isOpen,
  onClose: _onClose,
}) => {
  const infoLoaded = useStore(projectInfoLoaded);
  const [showButton, setShowButton] = useState(false);
  const [subProjectNames, setSubProjectNames] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!infoLoaded) return;
    const projectInfo = loadProjectInfo();
    if (!projectInfo || !projectInfo.maintainers) {
      setShowButton(false);
      return;
    }

    import("@service/walletService")
      .then(({ loadedPublicKey }) => {
        const publicKey = loadedPublicKey();
        const isMaintainer = publicKey
          ? projectInfo.maintainers.includes(publicKey)
          : false;
        setShowButton(isMaintainer);
      })
      .catch(() => setShowButton(false));

    loadCurrentSubProjects();
  }, [infoLoaded]);

  const handleClose = () => {
    setIsOpen(false);
    const modal = document.getElementById(
      "manage-sub-projects-modal",
    ) as HTMLDialogElement;
    if (modal) modal.close();
  };

  const loadCurrentSubProjects = async () => {
    try {
      const projectInfo = loadProjectInfo();
      if (!projectInfo) return;

      const projectKey = deriveProjectKey(projectInfo.name);
      
      // Check if method exists (contract might not be deployed yet)
      if (typeof (Tansu as any).get_sub_projects !== "function") {
        setSubProjectNames([]);
        return;
      }

      const res = await (Tansu as any).get_sub_projects({
        project_key: projectKey,
      });
      checkSimulationError(res);

      const subProjectKeys = res.result || [];
      const names: string[] = [];
      for (const key of subProjectKeys) {
        const subProject = await getProjectFromKey(key);
        if (subProject) {
          names.push(subProject.name);
        } else {
          const keyHex = Buffer.isBuffer(key) ? key.toString("hex") : key;
          names.push(keyHex.slice(0, 8) + "...");
        }
      }
      setSubProjectNames(names);
    } catch {
      setSubProjectNames([]);
    }
  };

  const getProjectFromKey = async (key: Buffer): Promise<any> => {
    try {
      const res = await Tansu.get_project({
        project_key: key,
      });
      checkSimulationError(res);
      return res.result;
    } catch {
      return null;
    }
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) {
      setError("Project name cannot be empty");
      return;
    }
    if (subProjectNames.includes(newProjectName.trim())) {
      setError("Project already in list");
      return;
    }
    setSubProjectNames([...subProjectNames, newProjectName.trim()]);
    setNewProjectName("");
    setError(null);
  };

  const handleRemoveProject = (index: number) => {
    setSubProjectNames(subProjectNames.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const projectInfo = loadProjectInfo();
      if (!projectInfo) {
        throw new Error("Project info not found");
      }

      const projectKey = deriveProjectKey(projectInfo.name);
      const subProjectKeys = subProjectNames.map((name) =>
        deriveProjectKey(name),
      );

      const publicKey = loadedPublicKey();
      if (!publicKey) {
        throw new Error("Please connect your wallet first");
      }
      Tansu.options.publicKey = publicKey;

      // Check if method exists (contract might not be deployed yet)
      if (typeof (Tansu as any).set_sub_projects !== "function") {
        throw new Error("set_sub_projects method not available. The contract needs to be deployed with the new methods first.");
      }

      const tx = await (Tansu as any).set_sub_projects({
        maintainer: publicKey,
        project_key: projectKey,
        sub_projects: subProjectKeys,
      });

      checkSimulationError(tx as any);
      const signedTxXdr = await signAssembledTransaction(tx);
      await sendSignedTransaction(signedTxXdr);

      toast.success(
        "Sub-projects updated",
        "Project sub-projects have been updated successfully.",
      );

      handleClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update sub-projects");
      toast.error("Error", err.message || "Failed to update sub-projects");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showButton) return null;

  return (
    <>
      <button
        className="px-4 py-3 sm:px-6 sm:py-4 flex gap-2 items-center bg-white cursor-pointer w-full sm:w-auto text-left border border-gray-200 hover:bg-gray-50 transition-colors rounded-md"
        onClick={() => setIsOpen(true)}
      >
        <img src="/icons/plus-fill.svg" className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm sm:text-base text-primary font-medium">
          Manage Sub-Projects
        </span>
      </button>
      {isOpen && (
        <Modal onClose={handleClose}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/team.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
              <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                Manage Sub-Projects
              </h6>
              <p className="text-sm sm:text-base text-secondary">
                Add or remove sub-projects to group them under this project. If this
                project has sub-projects, it acts as an organization.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:gap-[18px]">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Add Sub-Project
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddProject();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleAddProject} disabled={isLoading}>
                      Add
                    </Button>
                  </div>
                </div>

                {subProjectNames.length > 0 && (
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <p className="text-sm sm:text-base font-[600] text-primary">
                      Sub-Projects ({subProjectNames.length})
                    </p>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {subProjectNames.map((name, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <span className="text-sm sm:text-base text-primary">{name}</span>
                          <Button
                            onClick={() => handleRemoveProject(index)}
                            disabled={isLoading}
                            type="secondary"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={handleClose} disabled={isLoading} type="secondary">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading}>
                    Save Changes
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

export default ManageSubProjectsModal;
