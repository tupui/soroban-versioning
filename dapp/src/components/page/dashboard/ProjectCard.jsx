import React from "react";
import {
  getProject,
  getProjectHash,
} from "../../../service/ReadContractService";
import {
  setProjectId,
  setProject,
  setProjectRepoInfo,
  setConfigData,
  setProjectLatestSha,
  refreshLocalStorage,
} from "../../../service/StateService";
import { getAuthorRepo } from "../../../utils/editLinkFunctions";
import { fetchTOMLFromConfigUrl } from "../../../service/GithubService";
import { projectCardModalOpen } from "../../../utils/store";
import { convertGitHubLink } from "../../../utils/editLinkFunctions";
import { extractConfigData } from "../../../utils/utils";

const ProjectCard = ({ config }) => {
  const handleCardClick = async () => {
    refreshLocalStorage();
    try {
      setProjectId(config.projectName.toLowerCase());
      const res = await getProject();
      const project = res.data;
      if (project && project.name && project.config && project.maintainers) {
        setProject(project);
        const { username, repoName } = getAuthorRepo(project.config.url);
        if (username && repoName) {
          setProjectRepoInfo(username, repoName);
        }
        const tomlData = await fetchTOMLFromConfigUrl(project.config.url);
        if (tomlData) {
          const configData = extractConfigData(tomlData, project.name);
          setConfigData(configData);
        } else {
          setConfigData({});
        }

        const latestSha = await getProjectHash();
        if (
          latestSha.data &&
          typeof latestSha.data === "string" &&
          latestSha.data.match(/^[a-f0-9]{40}$/)
        ) {
          setProjectLatestSha(latestSha.data);
        } else {
          setProjectLatestSha("");
          if (latestSha.error) {
            alert(latestSha.errorMessage);
          }
        }

        projectCardModalOpen.set(true);
      } else {
        if (res.error) {
          alert(res.errorMessage);
        } else {
          alert(`There is not such project: ${config.projectName}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="project-card w-full border border-zinc-400 rounded-lg">
      <div
        className="rounded-lg overflow-hidden cursor-pointer group"
        onClick={handleCardClick}
      >
        <img
          src={
            config.logoImageLink !== undefined
              ? convertGitHubLink(config.logoImageLink)
              : "/fallback-image.jpg"
          }
          alt={config.projectName}
          className="thumbnail w-full aspect-[3/2] object-fill transition-transform duration-300 ease-in-out group-hover:scale-125"
        />
      </div>
      <div className="px-2 pb-2">
        <h3 className="project-name text-xl font-bold mt-2 mb-1">
          {config.projectName || "No project name"}
        </h3>
        <p className="description text-sm line-clamp-2 h-10">
          {config.description || "No description"}
        </p>
        <div className="links mt-4 ml-2 flex gap-2 items-center">
          {config.officials.websiteLink && (
            <a
              href={config.officials.websiteLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/logos/web.svg"
                width={19}
                height={19}
                className="icon-website"
              />
            </a>
          )}
          {config.officials.githubLink && (
            <a
              href={config.officials.githubLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/logos/github.svg"
                width={16}
                height={16}
                className="icon-github"
              />
            </a>
          )}
          {Object.entries(config.socialLinks).map(
            ([platform, link]) =>
              link && (
                <a
                  key={platform}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`/icons/logos/${platform}.svg`}
                    width={16}
                    height={16}
                    className={`icon-${platform}`}
                  />
                </a>
              ),
          )}
        </div>
        {config.organizationName ? (
          <p className="organization-name mt-3 text-right">
            by <span className="font-bold">{config.organizationName}</span>
          </p>
        ) : (
          <p className="organization-name mt-3 text-right">
            No organization name
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
