import { useStore } from "@nanostores/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { getFeaturedProjectsConfigData } from "../../../constants/featuredProjectsConfigData.js";
import { fetchTomlFromCid } from "../../../utils/ipfsFunctions";
import {
  getProjectFromName,
  getMember,
  getProjectPages,
  getAllProjects,
} from "../../../service/ReadContractService.ts";
import { loadConfigData } from "../../../service/StateService.ts";
import { convertGitHubLink } from "../../../utils/editLinkFunctions";
import { projectCardModalOpen } from "../../../utils/store.ts";
import { extractConfigData } from "../../../utils/utils";
import CreateProjectModal from "./CreateProjectModal.tsx";
import ProjectCard from "./ProjectCard";
import ProjectInfoModal from "./ProjectInfoModal.jsx";
import MemberProfileModal from "./MemberProfileModal.tsx";
import Spinner from "components/utils/Spinner.tsx";
import Pagination from "components/utils/Pagination.tsx";

const ProjectList = () => {
  const isProjectInfoModalOpen = useStore(projectCardModalOpen);
  const [projects, setProjects] = useState(undefined);
  const [filteredProjects, setFilteredProjects] = useState(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInOnChain, setIsInOnChain] = useState(false);
  const [configInfo, setConfigInfo] = useState();
  const [prevPath, setPrevPath] = useState("");
  const [memberNotFound, setMemberNotFound] = useState(false);

  const [projectInfo, setProjectInfo] = useState(null);
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [memberResult, setMemberResult] = useState(undefined);
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);

  const [onChainProjects, setOnChainProjects] = useState([]);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentUIPage, setCurrentUIPage] = useState(1);

  // Define the handler function at component level so it's available everywhere
  const handleCreateProjectModal = useCallback(() => {
    setShowCreateProjectModal(true);
  }, []);

  // Function to handle closing the modal - simplified to match other modals
  const closeCreateProjectModal = useCallback(() => {
    setShowCreateProjectModal(false);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = getFeaturedProjectsConfigData();
      setProjects(data);
      setFilteredProjects(data);
    };

    fetchProjects();

    // Save previous path if coming from another page
    const referrer = document.referrer;
    if (referrer && !referrer.includes(window.location.host)) {
      setPrevPath(referrer);
    }

    // Check for search parameters in URL
    const searchParams = new URLSearchParams(window.location.search);
    const urlSearchTerm = searchParams.get("search");
    let searchTimeout;
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
      // Set timeout to ensure projects are loaded before searching
      searchTimeout = setTimeout(() => handleSearch(), 300);
    }

    // Check if searching for a member
    const isMemberSearch = searchParams.get("member") === "true";
    if (isMemberSearch && urlSearchTerm) {
      handleMemberSearch(urlSearchTerm);
    }

    // Check for stored member profile
    const pendingMemberProfile = sessionStorage.getItem("pendingMemberProfile");
    if (pendingMemberProfile) {
      try {
        const memberData = JSON.parse(pendingMemberProfile);
        setMemberResult(memberData);
        setShowMemberProfileModal(true);
        sessionStorage.removeItem("pendingMemberProfile");
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Error loading pending member profile", e);
        }
      }
    }

    // Check if we should open create project modal
    const openCreateProjectModal = sessionStorage.getItem(
      "openCreateProjectModal",
    );
    if (openCreateProjectModal === "true") {
      setShowCreateProjectModal(true);
      sessionStorage.removeItem("openCreateProjectModal");
    }

    // Add event listeners for navbar search
    window.addEventListener("search-projects", handleSearchProjectEvent);
    window.addEventListener("show-member-profile", handleMemberProfileEvent);
    window.addEventListener("search-member", handleSearchMemberEvent);

    // Add event listener for create project modal
    document.addEventListener(
      "show-create-project-modal",
      handleCreateProjectModal,
    );
    document.addEventListener(
      "create-project-global",
      handleCreateProjectModal,
    );

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      window.removeEventListener("search-projects", handleSearchProjectEvent);
      window.removeEventListener(
        "show-member-profile",
        handleMemberProfileEvent,
      );
      window.removeEventListener("search-member", handleSearchMemberEvent);
      document.removeEventListener(
        "show-create-project-modal",
        handleCreateProjectModal,
      );
      document.removeEventListener(
        "create-project-global",
        handleCreateProjectModal,
      );
    };
  }, [handleCreateProjectModal]);

  const searchTimeoutRef = useRef(null);

  const handleSearchProjectEvent = useCallback((event) => {
    const term = event.detail;
    setSearchTerm(term);
    setMemberNotFound(false);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(), 100);
  }, []);

  const handleSearchMemberEvent = (event) => {
    const address = event.detail;
    setSearchTerm(address);
    handleMemberSearch(address);
  };

  const handleMemberProfileEvent = (event) => {
    const member = event.detail;
    setMemberResult(member);
    setShowMemberProfileModal(true);
  };

  useEffect(() => {
    if (projects && searchTerm) {
      handleSearch();
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
    if (!projects) return;

    setMemberNotFound(false);

    try {
      const filtered = projects.filter((project) => {
        // Safe check for null/undefined projectName
        return (
          project &&
          project.projectName &&
          project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      setFilteredProjects(filtered);

      if (searchTerm && filtered.length === 0) {
        checkProjectOnChain(searchTerm);
      }
    } catch (error) {
      // Remove console.error as it's an expected condition
      // Fallback to empty array on error
      setFilteredProjects([]);
    }
  };

  const checkProjectOnChain = async (projectName) => {
    setIsLoading(true);
    try {
      const project = await getProjectFromName(projectName);
      if (project && project.name && project.config && project.maintainers) {
        const tomlData = await fetchTomlFromCid(project.config.ipfs);
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
        // No toast error for expected "not found" condition
      }
    } catch (error) {
      // No toast error for expected "not found" condition
      setIsInOnChain(false);
      // Remove console.error as it's an expected condition
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setMemberNotFound(false);

    // Instead of navigating back, reload home page
    window.location.href = "/";
  };

  const handleMemberSearch = async (address) => {
    if (!address) return;

    setIsLoading(true);
    setMemberNotFound(false);

    try {
      const member = await getMember(address);
      if (member) {
        setMemberResult(member);
        setShowMemberProfileModal(true);
      } else {
        // No toast error for expected "not found" condition
        setMemberNotFound(true);
      }
    } catch (e) {
      // No toast error for expected "not found" condition
      setMemberNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOnChainProjects = async () => {
    setIsLoadingOnChain(true);
    try {
      // Get total pages
      const pages = await getProjectPages();
      if (pages !== null && pages > 0) {
        // Fetch all projects from all pages
        const allProjects = [];
        for (let page = 0; page < pages; page++) {
          const pageProjects = await getAllProjects(page);
          if (pageProjects && pageProjects.length > 0) {
            // Convert each project to config format
            for (const project of pageProjects) {
              try {
                const tomlData = await fetchTomlFromCid(project.config.ipfs);
                if (tomlData) {
                  const configData = extractConfigData(tomlData, project);
                  allProjects.push(configData);
                } else {
                  // Fallback if no TOML data
                  allProjects.push({
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
                  });
                }
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.error("Error loading project:", project.name, error);
                }
              }
            }
          }
        }
        setOnChainProjects(allProjects);
        setTotalPages(Math.ceil(allProjects.length / 10));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching on-chain projects:", error);
      }
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  useEffect(() => {
    fetchOnChainProjects();
  }, []);

  const handlePageChange = (page) => {
    setCurrentUIPage(page);
    // Scroll to top of All Projects section
    const allProjectsSection = document.querySelector('.all-projects-section');
    if (allProjectsSection) {
      allProjectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get current projects (10 per page)
  const getCurrentPageProjects = () => {
    const startIndex = (currentUIPage - 1) * 10;
    const endIndex = startIndex + 10;
    return onChainProjects.slice(startIndex, endIndex);
  };

  // Determine if we should show the featured projects heading
  const showFeaturedHeading =
    !searchTerm ||
    (filteredProjects && filteredProjects.length > 0 && !isInOnChain);

  return (
    <div className="project-list-container relative mx-auto w-full max-w-[984px] px-4">
      {showFeaturedHeading && (
        <div className="flex flex-col items-center gap-[30px] md:gap-[60px] mb-8">
          <div className="w-full flex justify-center items-center">
            <p className="text-[26px] leading-[42px] font-firamono text-pink">
              Featured Projects
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
          <Spinner />
        </div>
      ) : memberNotFound ? (
        <div className="flex flex-col items-center justify-center py-12">
          <img className="mx-auto mb-8" src="/images/no-result.svg" />
          <p className="text-xl text-center font-medium text-zinc-700">
            Member not found. Try searching for something else.
          </p>
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="project-list grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 justify-items-center items-stretch">
          {filteredProjects.map((project, index) => (
            <div className="w-full h-full" key={index}>
              <ProjectCard config={project} />
            </div>
          ))}
        </div>
      ) : isInOnChain ? (
        <div className="w-full sm:w-1/2 mx-auto pb-[120px]">
          <ProjectCard key={1} config={configInfo} />
        </div>
      ) : searchTerm ? (
        <div className="flex flex-col items-center justify-center py-12">
          <img className="mx-auto mb-8" src="/images/no-result.svg" />
          <p className="text-xl text-center font-medium text-zinc-700">
            Project not found. Try searching for something else.
          </p>
        </div>
      ) : (
        <div className="h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
          <p className="px-3 py-1 text-base sm:text-lg font-medium">
            No projects found. Try searching for something.
          </p>
        </div>
      )}

      {!searchTerm && !memberNotFound && !isInOnChain && (
        <div className="mt-16 all-projects-section">
          <div className="flex flex-col items-center gap-[30px] md:gap-[60px] mb-8">
            <div className="w-full flex justify-center items-center">
              <p className="text-[26px] leading-[42px] font-firamono text-pink">
                All Projects
              </p>
            </div>
          </div>

          {isLoadingOnChain ? (
            <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
              <Spinner />
              <p className="text-base text-secondary">
                Loading projects ...
              </p>
            </div>
          ) : onChainProjects.length > 0 ? (
            <div className="flex flex-col gap-8">
              <div className="project-list grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 justify-items-center items-stretch">
                {getCurrentPageProjects().map((project, index) => (
                  <div className="w-full h-full" key={`onchain-${(currentUIPage - 1) * 10 + index}`}>
                    <ProjectCard config={project} />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination
                    totalPage={totalPages}
                    currentPage={currentUIPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-xl text-center font-medium text-zinc-700">
                No projects found yet.
              </p>
              <p className="text-base text-center text-secondary mt-2">
                Be the first to register a project!
              </p>
            </div>
          )}
        </div>
      )}

      {showProjectInfoModal && (
        <ProjectInfoModal
          id="project-info-modal"
          projectInfo={projectInfo}
          onClose={() => projectCardModalOpen.set(false)}
        />
      )}

      {showCreateProjectModal && (
        <CreateProjectModal onClose={closeCreateProjectModal} />
      )}

      {showMemberProfileModal && memberResult && (
        <MemberProfileModal
          member={memberResult}
          address={searchTerm}
          onClose={() => setShowMemberProfileModal(false)}
        />
      )}
    </div>
  );
};

export default ProjectList;
