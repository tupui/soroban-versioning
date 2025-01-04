import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import ProjectCard from "./ProjectCard.jsx";
import ProjectInfoModal from "../../utils/ProjectInfoModal.jsx";
import { getDemoConfigData } from "../../../constants/demoConfigData";
import { projectCardModalOpen } from "../../../utils/store";
import { getProjectFromName } from "../../../service/ReadContractService.ts";
import {
  refreshLocalStorage,
  setProjectId,
  loadConfigData,
} from "../../../service/StateService.ts";
import { fetchTOMLFromConfigUrl } from "../../../service/GithubService.ts";
import { convertGitHubLink } from "../../../utils/editLinkFunctions";
import { extractConfigData } from "../../../utils/utils";

const ProjectList = () => {
  const isProjectInfoModalOpen = useStore(projectCardModalOpen);
  const [projects, setProjects] = useState(undefined);
  const [filteredProjects, setFilteredProjects] = useState(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInOnChain, setIsInOnChain] = useState(false);
  const [configInfo, setConfigInfo] = useState();
  const [registerButtonVisible, setRegisterButtonVisible] = useState(false);

  const [isModalOpen, setModalOpen] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isFilterClose, setIsFilterClose] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = getDemoConfigData();
      setProjects(data);
      setFilteredProjects(data);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects) {
      setRegisterButtonVisible(false);
      const filtered = projects.filter((project) =>
        project?.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredProjects(filtered);

      if (searchTerm && filtered.length === 0) {
        const timer = setTimeout(() => {
          checkProjectOnChain(searchTerm);
          setRegisterButtonVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [projects]);

  useEffect(() => {
    setModalOpen(isProjectInfoModalOpen);
    if (isProjectInfoModalOpen) {
      const configData = loadConfigData();
      if (configData?.logoImageLink) {
        setProjectInfo({
          ...configData,
          logoImageLink: convertGitHubLink(configData.logoImageLink),
        });
      } else {
        setProjectInfo(configData);
      }
    }
  }, [isProjectInfoModalOpen]);

  const handleSearch = () => {
    if (projects && searchTerm) {
      setRegisterButtonVisible(false);
      const filtered = projects.filter((project) =>
        project?.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredProjects(filtered);

      if (searchTerm && filtered.length === 0) {
        checkProjectOnChain(searchTerm);
        setRegisterButtonVisible(true);
      }
    }
  };

  const handleRegister = () => {
    refreshLocalStorage();
    setProjectId(searchTerm.toLowerCase());
    window.location.href = "/register";
  };

  const checkProjectOnChain = async (projectName) => {
    setIsLoading(true);
    try {
      const res = await getProjectFromName(projectName);
      const project = res.data;
      if (project && project.name && project.config && project.maintainers) {
        const tomlData = await fetchTOMLFromConfigUrl(project.config.url);
        if (tomlData) {
          const configData = extractConfigData(tomlData, project.name);
          setConfigInfo(configData);
        } else {
          // alert("Can not read config data.");
          const configData = {
            projectName: project.name,
            logoImageLink: undefined,
            thumbnailImageLink: "",
            description: "",
            organizationName: "",
            officials: {
              githubLink: project.config.url,
            },
            socialLinks: {},
            authorGithubNames: [],
            maintainersAddresses: project.maintainers,
          };
          setConfigInfo(configData);
        }
        setIsInOnChain(true);
      } else {
        setIsInOnChain(false);
        alert(res.errorMessage || "Can not get project info.");
      }
    } catch (error) {
      console.error("Error checking project on-chain:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSearchBox = () => {
    setIsFilterClose(true);
    setTimeout(() => setIsFilterVisible(false), 200);
  };

  const openSearchBox = () => {
    setIsFilterVisible(true);
    setIsFilterClose(false);
  };

  return (
    <div className="project-list-container relative  max-w-[984px] mx-auto">
      <div className="flex flex-col items-center gap-[60px]">
        <div className="flex justify-center items-center gap-6">
          <div
            className="px-[30px] py-[18px] flex gap-3 border border-zinc-800 cursor-pointer"
            onClick={() => openSearchBox()}
          >
            <img src="/icons/search.svg" width={20} height={20} />
            <p className="text-[20px] leading-5 font-firacode text-pink">
              Explore Projects
            </p>
          </div>
          <div className="px-[30px] py-[18px] flex gap-3 bg-white cursor-pointer">
            <p className="text-[20px] leading-5 font-firacode text-pink">
              Add Project
            </p>
            <img src="/icons/plus.svg" width={20} height={20} />
          </div>
        </div>
        <div className="flex justify-center items-center gap-[18px]">
          <p className="text-[26px] leading-[42px] font-firaMono text-pink">
            Featured Projects
          </p>
          <img src="/icons/swap.svg" width={42} height={42} />
        </div>
      </div>

      {/* This div is the search inbox component */}
      <div
        className={`filters bg-white shadow-modal absolute top-0 w-full ${isFilterVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`w-full px-9 flex flex-col gap-8 items-center overflow-hidden transition-all duration-200 ${isFilterClose ? "h-0 py-0" : "h-fit py-9"}`}
        >
          <div className="w-full flex gap-[10px]">
            <div className="search-container relative w-full">
              <input
                type="text"
                placeholder="What Are You Looking For?"
                className="w-full font-firacode text-[20px] leading-5 border border-zinc-800 p-[18px] pr-10"
                value={searchTerm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div
                className="absolute right-1 sm:right-[18px] top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => {
                  setSearchTerm("");
                  setRegisterButtonVisible(false);
                  setFilteredProjects(projects);
                }}
              >
                <img
                  src="/icons/cancel.svg"
                  width={20}
                  height={20}
                  className="icon-cancel"
                />
              </div>
            </div>
            <button
              className="bg-pink shrink-0 cursor-pointer flex justify-center items-center gap-3 px-[30px] py-[18px]"
              onClick={handleSearch}
            >
              <img
                src="/icons/search-white.svg"
                width={20}
                height={20}
                className="icon-search"
              />
              <p className="text-[20px] leading-5 font-firacode text-white">
                Search
              </p>
            </button>
          </div>
          <div
            id="search-result"
            className="font-firacode text-lg leading-[18px] text-pink"
          >
            Results ({filteredProjects?.length || 0})
          </div>
        </div>
        <div
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 p-4 bg-red cursor-pointer"
          onClick={() => {
            closeSearchBox();
          }}
        >
          <img
            src="/icons/cancel-white.svg"
            width={20}
            height={20}
            className="icon-cancel"
          />
        </div>
      </div>

      {filteredProjects !== undefined &&
        (filteredProjects.length > 0 ? (
          <div className="project-list pt-[42px] pb-[120px] grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 justify-items-center">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={index} config={project} />
            ))}
          </div>
        ) : isLoading ? (
          <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
            <p className="px-3 py-1 text-base sm:text-lg font-semibold border-2 border-zinc-700 rounded-lg">
              {" "}
              looking if the project is registered on chain...
            </p>
          </div>
        ) : isInOnChain ? (
          <div className="w-1/2 mx-auto pt-[42px] pb-[120px]">
            <ProjectCard key={1} config={configInfo} />
          </div>
        ) : (
          registerButtonVisible && (
            <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
              <button
                className="register-btn mr-2 px-3 sm:px-4 py-2 bg-black text-white text-2xl sm:text-3xl rounded-lg"
                onClick={handleRegister}
              >
                Register
              </button>
            </div>
          )
        ))}

      {isModalOpen && (
        <ProjectInfoModal
          id="project-info-modal"
          projectInfo={projectInfo}
          onClose={() => projectCardModalOpen.set(false)}
        />
      )}
    </div>
  );
};

export default ProjectList;
