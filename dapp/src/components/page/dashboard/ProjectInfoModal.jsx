import { useEffect, useState } from "react";

import { loadProjectName } from "@service/StateService";
import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Modal from "../../utils/Modal";
import DonateModal from "../project/DonateModal";

const ProjectInfoModal = ({ id, projectInfo, onClose }) => {
  const [projectName, setProjectName] = useState("");

  const getProjectName = () => {
    const projectName = loadProjectName();
    if (projectName) {
      setProjectName(projectName);
    }
  };

  useEffect(() => {
    getProjectName();
  }, []);

  return (
    <Modal onClose={onClose}>
      {projectInfo && Object.keys(projectInfo).length > 0 ? (
        <>
          <div className="flex max-lg:flex-col gap-12">
            <img
              alt="Project Thumbnail"
              src={projectInfo?.logoImageLink || "/fallback-image.jpg"}
              className="w-[220px] h-[220px]"
            />
            <div className="flex-grow flex flex-col gap-[30px]">
              <div className="flex flex-col gap-3">
                <p className="leading-4 text-base font-medium text-primary">
                  {projectInfo?.organizationName || "No organization name"}
                </p>
                <h2 className="leading-6 text-2xl font-medium text-primary">
                  {projectInfo.projectName || "No project name"}
                </h2>
                <p className="leading-4 text-base text-secondary">
                  {projectInfo?.description || "No description"}
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-[30px]">
                <div className="flex flex-col gap-3">
                  <h3 className="leading-4 text-base text-secondary">
                    Official Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {projectInfo?.officials &&
                      Object.entries(projectInfo.officials).map(
                        ([platform, link]) =>
                          link && (
                            <a
                              key={platform}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={
                                  platform === "websiteLink"
                                    ? "/icons/logos/web.svg"
                                    : platform === "githubLink"
                                      ? "/icons/logos/github.svg"
                                      : ""
                                }
                                width={24}
                                height={24}
                                className={`icon-${platform}`}
                              />
                            </a>
                          ),
                      )}
                  </div>
                </div>
              </div>
              <div className="flex max-lg:flex-col gap-[18px]">
                <Button
                  icon="/icons/search-white.svg"
                  size="xl"
                  onClick={() => navigate(`/project?name=${projectName}`)}
                >
                  View Details
                </Button>
                <Button
                  type="secondary"
                  icon="/icons/gear.svg"
                  size="xl"
                  onClick={() => navigate(`/governance?name=${projectName}`)}
                >
                  Governance
                </Button>
                <DonateModal>
                  <Button type="secondary" icon="/icons/heart.svg" size="xl">
                    Support
                  </Button>
                </DonateModal>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {projectName || "No project name"}
          </h2>
          <div className="h-40 flex items-center px-4 sm:px-8 pb-4">
            <p className="text-lg text-center">
              This project is missing a{" "}
              <a
                href="https://tansu.dev/docs/project_information_file"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                tansu.toml
              </a>{" "}
              configuration file.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center"
              onClick={handleDetailClick}
            >
              Detail
              <img
                src="/icons/arrow.svg"
                alt="->"
                className="w-7 h-5 object-contain"
              />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProjectInfoModal;
