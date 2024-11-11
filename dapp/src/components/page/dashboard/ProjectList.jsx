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

  // const options = [
  //   { label: 'All', value: 'all' },
  //   { label: 'Web', value: 'web' },
  //   { label: 'Mobile', value: 'mobile' },
  //   { label: 'Desktop', value: 'desktop' },
  // ];

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
  }, [searchTerm, projects]);

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
    console.log("Search function activated");
  };

  const handleRegister = () => {
    refreshLocalStorage();
    setProjectId(searchTerm.toLowerCase());
    window.location.href = "/register";
  };

  const checkProjectOnChain = async (projectName) => {
    console.log("search:", projectName);
    setIsLoading(true);
    try {
      const project = await getProjectFromName(projectName);
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
      }
    } catch (error) {
      console.error("Error checking project on-chain:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="project-list-container">
      <div className="filters flex gap-2 justify-center sm:gap-4 mb-4">
        {/* <Dropdown options={options} onSelect={(e) => setCategory(e.target.value)} /> */}
        <div className="search-container relative w-1/2">
          <input
            type="text"
            placeholder="Search or register a project..."
            className="w-full border rounded-2xl pl-3 sm:pl-4 pr-6 sm:pr-8 py-1 sm:py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-zinc-300 cursor-pointer flex justify-center items-center p-0.5 pl-[3px]"
            onClick={handleSearch}
          >
            <img
              src="/icons/search.svg"
              width={20}
              height={20}
              className="icon-search"
            />
          </div>
        </div>
      </div>

      {filteredProjects !== undefined &&
        (filteredProjects.length > 0 ? (
          <div>
            <div
              id="featured-projects-topic"
              className="grid place-items-center gap-8 mb-1.5 mt-12 md:flex"
            >
              <span className="text-2xl sm:text-4xl text-nowrap px-1.5 font-medium bg-lime rounded-md">
                Featured Projects
              </span>
              <p className="text-2xl font-normal text-center md:text-start"></p>
            </div>
            <div className="project-list py-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={index} config={project} />
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
            <p className="px-3 py-1 text-base sm:text-lg font-semibold border-2 border-zinc-700 rounded-lg">
              {" "}
              looking if the project is registered on chain...
            </p>
          </div>
        ) : isInOnChain ? (
          <ProjectCard key={1} config={configInfo} />
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
