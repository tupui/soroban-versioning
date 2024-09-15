import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { loadProjectName } from '../../service/StateService';

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
    window.location.href = '/project';
  };

  return (
    <Modal id={id} title="" onClose={onClose}>
      <div className="space-y-4 sm:space-y-6 w-[calc(100vw-80px)] sm:w-[calc(100vw-120px)] md:w-full md:max-w-[800px]">
        {projectInfo && Object.keys(projectInfo).length > 0 ? (
          <>
            <div className="flex items-center space-x-4">
              {/* {projectInfo.logoImageLink &&
                <img id="project-logo" src={projectInfo.logoImageLink} alt="Project Logo" className="w-12 h-12 object-contain" />
              } */}
              <h2 id="view-modal-project-name" className="text-2xl sm:text-3xl font-bold">{projectInfo.projectName || "No project name"}</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
              {/* <img id="project-thumbnail" src={projectInfo?.thumbnailImageLink || "/fallback-image.jpg"} alt="Project Thumbnail" className="w-full md:w-[40%] object-cover rounded-lg" /> */}
              <img id="project-thumbnail" src={projectInfo?.logoImageLink || "/fallback-image.jpg"} alt="Project Thumbnail" className="w-64 sm:w-[40%] object-cover rounded-lg" />
              <div className="flex-1 pt-2 w-full">
                <p id="project-description" className="flex-1">{projectInfo?.description || "No description"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-col">
                <h3 className="font-semibold mb-2">Official Links</h3>
                <div id="official-links" className="flex flex-wrap gap-2">
                  {projectInfo?.officials && Object.entries(projectInfo.officials).map(([platform, link]) => (
                    link && (
                      <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 bg-zinc-200 hover:bg-zinc-300 rounded-lg px-3 py-1 text-sm">
                        <span className="w-4 h-4">
                          <img src={platform === "websiteLink" ? "/icons/web.svg" : platform === "githubLink" ? "/icons/github.svg" : ""} width={16} height={16} className={`icon-${platform}`}/>
                        </span>
                        <span>{platform === "websiteLink" ? "Website" : platform === "githubLink" ? "Github" : ""}</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col">
                <h3 className="font-semibold mb-2">Social</h3>
                <div id="social-links" className="flex flex-wrap gap-2">
                  {projectInfo?.socialLinks && Object.entries(projectInfo.socialLinks).map(([platform, link]) => (
                    link && (
                      <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 bg-zinc-200 hover:bg-zinc-300 rounded-lg px-3 py-1 text-sm">
                      <span className="w-4 h-4">
                        <img src={`/icons/${platform}.svg`} width={16} height={16} className={`icon-${platform}`}/>
                      </span>
                      <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                    </a>
                    )
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-x-4">
              {projectInfo?.companyName ? (
                <p id="company-name" className="w-full sm:w-auto text-left">Developed by <span className="font-extrabold">{projectInfo.companyName}</span></p>
              ) : (
                <p id="company-name" className="w-full sm:w-auto text-left">No company name</p>
              )}
              <button 
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center self-end sm:self-auto"
                onClick={handleDetailClick}
              >
                Detail
                <img id="right-arrow-icon" src="/icons/arrow.svg" alt="->" className="w-7 h-5 object-contain" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 id="view-modal-project-name" className="text-2xl sm:text-3xl font-bold">{projectName || "No project name"}</h2>
            <div className="h-40 flex items-center px-4 sm:px-8 pb-4">
              <p className="text-lg text-center">This project is missing a <a href='https://tansu.dev/docs/developers/project_information_file' target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">tansu.toml</a> configuration file.</p>
            </div>
            <div className="flex justify-end">
              <button 
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center"
                onClick={handleDetailClick}
              >
                Detail
                <img id="right-arrow-icon" src="/icons/arrow.svg" alt="->" className="w-7 h-5 object-contain" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProjectInfoModal;