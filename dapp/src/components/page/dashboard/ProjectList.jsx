import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { getDemoConfigData } from "../../../constants/demoConfigData";
import { fetchTOMLFromConfigUrl } from "../../../service/GithubService.ts";
import { getProjectFromName } from "../../../service/ReadContractService.ts";
import { loadConfigData } from "../../../service/StateService.ts";
import { convertGitHubLink } from "../../../utils/editLinkFunctions";
import { projectCardModalOpen } from "../../../utils/store.ts";
import { extractConfigData } from "../../../utils/utils";
import CreateProjectModal from "./CreateProjectModal.tsx";
import ProjectCard from "./ProjectCard.jsx";
import ProjectInfoModal from "./ProjectInfoModal.jsx";
import Button from "components/utils/Button.tsx";

const ProjectList = () => {
  const isProjectInfoModalOpen = useStore(projectCardModalOpen);
  const [projects, setProjects] = useState(undefined);
  const [filteredProjects, setFilteredProjects] = useState(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInOnChain, setIsInOnChain] = useState(false);
  const [configInfo, setConfigInfo] = useState();
  const [registerButtonVisible, setRegisterButtonVisible] = useState(false);

  const [projectInfo, setProjectInfo] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isFilterClose, setIsFilterClose] = useState(true);
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

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
  }, [projects, searchTerm]);

  useEffect(() => {
    setShowProjectInfoModal(isProjectInfoModalOpen);
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
    if (projects) {
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

  const checkProjectOnChain = async (projectName) => {
    setIsLoading(true);
    try {
      const res = await getProjectFromName(projectName);
      const project = res.data;
      if (project && project.name && project.config && project.maintainers) {
        const tomlData = await fetchTOMLFromConfigUrl(project.config.url);
        if (tomlData) {
          const configData = extractConfigData(tomlData, project);
          setConfigInfo(configData);
        } else {
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

  const closeSearchBox = () => {
    setIsFilterClose(true);
    setTimeout(() => setIsFilterVisible(false), 200);
  };

  const openSearchBox = () => {
    setIsFilterVisible(true);
    setIsFilterClose(false);
  };

  return (
    <div className="project-list-container relative mx-auto w-full max-w-[984px]">
      <div className="flex flex-col items-start lg:items-center gap-[60px]">
        <div className="flex max-lg:flex-col justify-center items-start lg:items-center gap-6">
          <Button
            type="secondary"
            icon="/icons/search.svg"
            className="px-[30px] py-[18px]"
            onClick={() => openSearchBox()}
          >
            <p className="text-xl leading-5 font-firacode text-pink">
              Explore Projects
            </p>
          </Button>
          <Button
            type="quaternary"
            order="secondary"
            icon="/icons/plus-fill.svg"
            className="px-[30px] py-[18px]"
            onClick={() => setShowCreateProjectModal(true)}
          >
            <p className="text-xl leading-5">Add Project</p>
          </Button>
        </div>
        <div className="w-full flex justify-center items-center gap-[18px]">
          <p className="text-[26px] leading-[42px] font-firamono text-pink">
            Featured Projects
          </p>
        </div>
      </div>

      {/* This div is the search inbox component */}
      <div
        className={`filters bg-white shadow-modal absolute top-0 w-full ${isFilterVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`w-full px-9 flex flex-col gap-8 items-center overflow-hidden transition-all duration-200 ${isFilterClose ? "h-0 py-0" : "h-fit py-9"}`}
        >
          <div className="w-full flex max-lg:flex-col gap-[10px]">
            <div className="search-container relative w-full">
              <input
                type="text"
                placeholder="What Are You Looking For?"
                className="w-full font-firacode text-xl leading-5 border border-zinc-800 p-[18px] pr-10"
                value={searchTerm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div
                className="absolute right-[18px] top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => {
                  setSearchTerm("");
                  setRegisterButtonVisible(false);
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
            <Button
              icon="/icons/search-white.svg"
              className="px-[30px] py-[18px]"
              onClick={handleSearch}
            >
              <p className="text-xl leading-5">Search</p>
            </Button>
          </div>
          <div
            id="search-result"
            className="font-firacode text-lg leading-[18px] text-pink"
          >
            Results ({filteredProjects?.length || 0})
          </div>
        </div>
        <div
          className="absolute top-0 right-0 lg:translate-x-1/2 -translate-y-1/2 p-[18px] bg-red cursor-pointer"
          onClick={() => {
            setSearchTerm("");
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
          <div className="project-list pt-[42px] grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 justify-items-center">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={index} config={project} />
            ))}
          </div>
        ) : isLoading ? (
          <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
            <p className="px-3 py-1 text-base sm:text-lg font-medium border-2 border-zinc-700 rounded-lg">
              looking if the project is registered on chain...
            </p>
          </div>
        ) : isInOnChain ? (
          <div className="w-1/2 mx-auto pt-[42px] pb-[120px]">
            <ProjectCard key={1} config={configInfo} />
          </div>
        ) : (
          <img className="mx-auto" src="/images/no-result.svg" />
        ))}

      {showProjectInfoModal && (
        <ProjectInfoModal
          id="project-info-modal"
          projectInfo={projectInfo}
          onClickSupport={() => setShowDonateModal(true)}
          onClose={() => projectCardModalOpen.set(false)}
        />
      )}
      {showCreateProjectModal && (
        <CreateProjectModal onClose={() => setShowCreateProjectModal(false)} />
      )}
    </div>
  );
};

export default ProjectList;
