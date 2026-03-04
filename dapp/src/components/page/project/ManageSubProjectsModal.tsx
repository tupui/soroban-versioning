import { useStore } from "@nanostores/react";
import { loadProjectInfo } from "@service/StateService";
import { projectInfoLoaded } from "utils/store";
import { useEffect, useState } from "react";
import Button from "components/utils/Button";
import Input from "components/utils/Input";
import Modal from "components/utils/Modal";
import { toast } from "utils/utils";
import { getProjectFromId } from "@service/ReadContractService";
import {
  signAssembledTransaction,
  sendSignedTransaction,
} from "@service/TxService";
import { loadedPublicKey } from "@service/walletService";
import Tansu from "contracts/soroban_tansu";
import { checkSimulationError } from "utils/contractErrors";
import { deriveProjectKey, normalizeSubProjectKeys } from "utils/projectKey";
import React from "react";

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

  useEffect(() => {
    if (isOpen && infoLoaded) {
      loadCurrentSubProjects();
    }
  }, [isOpen, infoLoaded]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const loadCurrentSubProjects = async () => {
    try {
      const projectInfo = loadProjectInfo();
      if (!projectInfo) return;

      const projectKey = deriveProjectKey(projectInfo.name);

      if (typeof (Tansu as any).get_sub_projects !== "function") {
        setSubProjectNames([]);
        return;
      }

      const res = await (Tansu as any).get_sub_projects({
        project_key: projectKey,
      });

      checkSimulationError(res);

      const subProjectKeys = normalizeSubProjectKeys(res.result);
      const names: string[] = [];

      for (const keyBuffer of subProjectKeys) {
        const project = await getProjectFromId(keyBuffer);
        if (project?.name) {
          names.push(project.name);
        } else {
          names.push(keyBuffer.toString("hex").slice(0, 8) + "...");
        }
      }

      setSubProjectNames(names);
    } catch {
      setSubProjectNames([]);
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

      if (typeof (Tansu as any).set_sub_projects !== "function") {
        throw new Error(
          "set_sub_projects method not available. The contract needs deployment with new methods.",
        );
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
        className="inline-flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0 flex-1 sm:flex-initial rounded-lg border border-zinc-200 bg-white text-primary text-sm font-medium shadow-[var(--shadow-card)] hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer text-left whitespace-nowrap"
        onClick={() => setIsOpen(true)}
      >
        <img
          src="/icons/plus-fill.svg"
          className="w-5 h-5 flex-shrink-0"
          alt=""
        />
        <span>Sub-Projects</span>
      </button>

      {isOpen && (
        <Modal onClose={handleClose}>
          <div className="flex flex-col gap-6 w-full">
            <h6 className="text-xl font-medium text-primary">Sub-Projects</h6>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {subProjectNames.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-primary">
                  Current sub-projects
                </p>
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-100">
                  {subProjectNames.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="text-sm text-primary truncate">
                        {name}
                      </span>
                      <Button
                        type="secondary"
                        onClick={() => handleRemoveProject(index)}
                        disabled={isLoading}
                        className="shrink-0 text-xs py-1 px-2"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProjectName(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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

            <div className="flex justify-end gap-3">
              <Button onClick={handleClose} type="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                isLoading={isLoading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ManageSubProjectsModal;
