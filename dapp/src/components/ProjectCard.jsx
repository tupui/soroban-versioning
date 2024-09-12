import React from 'react';

const ProjectCard = ({ config }) => {
  const handleCardClick = () => {
    // Implement card click functionality here
    console.log(`Clicked on ${config.projectName}`);
  };

  return (
    <div className="project-card max-w-[400px] w-full border border-zinc-400 rounded-lg" onClick={handleCardClick}>
      <div className="rounded-lg overflow-hidden">
        <img
          src={config.thumbnailImageLink || '/fallback-image.jpg'}
          alt={config.projectName}
          className="thumbnail w-full aspect-[3/2] object-cover"
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
