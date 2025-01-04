import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { loadProjectName } from "@service/StateService";

const ProjectInfoModal = ({ id, projectInfo, onClose }) => {
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const getProjectName = () => {
      const projectName = loadProjectName();
      if (projectName) {
        setProjectName(projectName);
      }
    };

    getProjectName();
  }, []);

  const handleDetailClick = () => {
    window.location.href = `/project?name=${projectName}`;
  };

  return (
    <Modal id={id} title="" onClose={onClose}>
      <div className="p-9 w-[calc(100vw-80px)] sm:w-[calc(100vw-120px)] md:w-[984px]">
        {projectInfo && Object.keys(projectInfo).length > 0 ? (
          <>
            <div className="flex gap-12">
              <img
                id="project-thumbnail"
                src={projectInfo?.logoImageLink || "/fallback-image.jpg"}
                alt="Project Thumbnail"
                className="object-cover rounded-lg"
              />
              <div className="flex flex-col gap-[30px]">
                <div className="flex gap-3">
                  <div className="px-3 py-2">
                    <p className="text-sm leading-[14px] font-bold font-victorMono">
                      Active
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-sm leading-[14px] font-bold font-victorMono">
                      1244 users
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h2
                    id="view-modal-project-name"
                    className="text-2xl leading-6 font-medium font-firaMono text-pink"
                  >
                    {projectInfo.projectName || "No project name"}
                  </h2>
                  <p
                    id="project-description"
                    className="text-base leading-4 font-victorMono text-zinc-800"
                  >
                    {projectInfo?.description || "No description"}
                  </p>
                </div>
                <div className="flex gap-[30px]">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-base leading-4 font-firaMono text-zinc-800">
                      Official Links
                    </h3>
                    <div id="official-links" className="flex flex-wrap gap-2">
                      {projectInfo?.officials &&
                        Object.entries(projectInfo.officials).map(
                          ([platform, link]) =>
                            link && (
                              <a
                                key={platform}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className=""
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
                  <div className="flex flex-col gap-[14px]">
                    <h3 className="text-base leading-4 font-firaMono text-zinc-800">
                      Developed by
                    </h3>
                    <p
                      id="organization-name"
                      className="text-base leading-4 font-firaMono text-pink font-medium"
                    >
                      {projectInfo?.organizationName || "No organization name"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-[18px]">
                  <button
                    className="px-[30px] py-[18px] flex gap-3 bg-pink"
                    onClick={handleDetailClick}
                  >
                    <img src="/icons/search-white.svg" alt="" className="w-5" />
                    <p className="text-xl leading-5 font-firacode text-white">
                      View Details
                    </p>
                  </button>
                  <button
                    className="px-[30px] py-[18px] flex gap-3 border border-zinc-800"
                    onClick={() => {}}
                  >
                    <img src="/icons/heart.svg" alt="" className="w-5" />
                    <p className="text-xl leading-5 font-firacode text-pink">
                      Provide Support
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2
              id="view-modal-project-name"
              className="text-2xl sm:text-3xl font-bold"
            >
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
                  id="right-arrow-icon"
                  src="/icons/arrow.svg"
                  alt="->"
                  className="w-7 h-5 object-contain"
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProjectInfoModal;
