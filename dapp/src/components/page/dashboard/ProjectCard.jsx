import { fetchTOMLFromConfigUrl } from "../../../service/GithubService";
import {
  getProject,
  getProjectHash,
} from "../../../service/ReadContractService";
import {
  refreshLocalStorage,
  setConfigData,
  setProject,
  setProjectId,
  setProjectLatestSha,
  setProjectRepoInfo,
} from "../../../service/StateService";
import {
  convertGitHubLink,
  getAuthorRepo,
} from "../../../utils/editLinkFunctions";
import { projectCardModalOpen } from "../../../utils/store";
import { extractConfigData, toast } from "../../../utils/utils";

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
            toast.error("Something Went Wrong!", latestSha.errorMessage);
          }
        }

        projectCardModalOpen.set(true);
      } else {
        if (res.error) {
          toast.error("Something Went Wrong!", res.errorMessage);
        } else {
          toast.error(
            "Something Went Wrong!",
            `There is not such project: ${config.projectName}`,
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="project-card w-full shadow-card">
      <div
        className="h-[290px] bg-white/25 backdrop-blur-[9px] overflow-hidden cursor-pointer group flex justify-center items-center"
        onClick={handleCardClick}
      >
        <img
          src={
            config.logoImageLink !== undefined
              ? convertGitHubLink(config.logoImageLink)
              : "/fallback-image.jpg"
          }
          alt={config.projectName}
          className="thumbnail aspect-[3/2] object-fill transition-transform duration-300 ease-in-out group-hover:scale-125"
        />
      </div>
      <div className="bg-white p-6 flex flex-col gap-[30px]">
        <div className="flex flex-col gap-3">
          <h3 className="project-name text-2xl leading-6 font-medium font-firaMono text-pink">
            {config.projectName || "No project name"}
          </h3>
          <p className="description text-base font-victorMono text-zinc-800 line-clamp-2 h-10">
            {config.description || "No description"}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <div className="links flex gap-2 items-center">
            {config.officials.websiteLink && (
              <a
                href={config.officials.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/icons/logos/web.svg"
                  width={24}
                  height={24}
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
                  width={24}
                  height={24}
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
            <p className="organization-name text-base leading-4 font-firaMono text-pink font-light">
              by <span className="font-medium">{config.organizationName}</span>
            </p>
          ) : (
            <p className="organization-name text-base leading-4 font-firaMono text-pink">
              No organization name
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
