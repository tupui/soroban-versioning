import React from 'react';
import { getProject, getProjectHash } from "../service/ReadContractService";
import { setProjectId, setProject, setProjectRepoInfo, setConfigData, setProjectLatestSha, refreshLocalStorage } from "../service/StateService";
import { getAuthorRepo } from "../service/utils";
import { fetchTOMLFromConfigUrl } from "../service/GithubService";

const ProjectCard = ({ config }) => {

  const handleCardClick = async () => {
    refreshLocalStorage();
    try {
      setProjectId(config.projectName.toLowerCase());
      const project = await getProject();
      if (project && project.name && project.config && project.maintainers) {
        setProject(project);
        const { username, repoName } = getAuthorRepo(project.config.url);
        if (username && repoName) {
          setProjectRepoInfo(username, repoName);
        }
        const tomlData = await fetchTOMLFromConfigUrl(project.config.url);
        if (tomlData) {
          const configData = {
            projectName: project.name,
            logoImageLink: tomlData.DOCUMENTATION?.ORG_LOGO || "",
            thumbnailImageLink: tomlData.DOCUMENTATION?.ORG_THUMBNAIL || "",
            description: tomlData.DOCUMENTATION?.ORG_DESCRIPTION || "",
            companyName: tomlData.DOCUMENTATION?.ORG_NAME || "",
            officials: {
              websiteLink: tomlData.DOCUMENTATION?.ORG_URL || "",
              githubLink: tomlData.DOCUMENTATION?.ORG_GITHUB || "",
            },
            socialLinks: {
              twitter: "",
              telegram: "",
              discord: "",
              instagram: "",
            },
            authorGithubNames: tomlData.PRINCIPALS?.map((p) => p.github) || [],
            maintainersAddresses: tomlData.ACCOUNTS || [],
          };
          setConfigData(configData);
        } else {
          setConfigData({});
        }

        const latestSha = await getProjectHash();
        if (typeof latestSha === 'string' && latestSha.match(/^[a-f0-9]{40}$/)) {
          setProjectLatestSha(latestSha);
        } else setProjectLatestSha("");

        window.location.href = '/commit';
      } else {
        alert(`There is not such project: ${config.projectName}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="project-card max-w-[400px] w-full border border-zinc-400 rounded-lg">
      <div className="rounded-lg overflow-hidden cursor-pointer group" onClick={handleCardClick}>
        <img
          src={config.thumbnailImageLink || '/fallback-image.jpg'}
          alt={config.projectName}
          className="thumbnail w-full aspect-[3/2] object-cover transition-transform duration-300 ease-in-out group-hover:scale-125"
        />
      </div>
      <div className="px-2 pb-2">
        <h3 className="project-name text-xl font-bold mt-2 mb-1">{config.projectName}</h3>
        <p className="description text-sm line-clamp-2 h-10">{config.description}</p>
        <div className="links mt-4 ml-2 flex gap-2 items-center">
          {config.officials.websiteLink && (
            <a href={config.officials.websiteLink} target="_blank" rel="noopener noreferrer">
              <img src='/icons/web.svg' width={19} height={19} className='icon-website'/>
            </a>
          )}
          {config.officials.githubLink && (
            <a href={config.officials.githubLink} target="_blank" rel="noopener noreferrer">
              <img src='/icons/github.svg' width={16} height={16} className='icon-github'/>
            </a>
          )}
          {Object.entries(config.socialLinks).map(([platform, link]) => (
            link && (
              <a key={platform} href={link} target="_blank" rel="noopener noreferrer">
                <img src={`/icons/${platform}.svg`} width={16} height={16} className={`icon-${platform}`}/>
              </a>
            )
          ))}
        </div>
        <p className="company-name mt-3 text-right">by <span className="font-bold">{config.companyName}</span></p>
      </div>
    </div>
  );
};

export default ProjectCard;
