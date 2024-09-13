import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import ProjectCard from './ProjectCard.jsx';
import Dropdown  from './utils/DropDown.jsx';
import ProjectInfoModal from './utils/ProjectInfoModal.jsx';
import { getDemoConfigData } from '../constants/demoConfigData';
import { refreshLocalStorage, setProjectId, loadConfigData } from '../service/StateService';
import { projectCardModalOpen } from '../utils/store.js';
import { convertGitHubLink } from '../utils/editLinkFunctions';

const ProjectList = () => {
  const isProjectInfoModalOpen = useStore(projectCardModalOpen);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

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
      await new Promise(resolve => setTimeout(resolve, 100));
      const data = getDemoConfigData();
      setProjects(data);
      setFilteredProjects(data);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project?.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (category === 'all')
    );
    setFilteredProjects(filtered);
  }, [searchTerm, category, projects]);

  useEffect(() => {
    setModalOpen(isProjectInfoModalOpen);
    if (isProjectInfoModalOpen) {
      const configData = loadConfigData();
      if (configData?.logoImageLink) {
        setProjectInfo({
          ...configData,
          logoImageLink: convertGitHubLink(configData.logoImageLink)
        });
      } else {
        setProjectInfo(configData);
      }
    }
  }, [isProjectInfoModalOpen]);

  const handleSearch = () => {
    console.log('Search function activated');
  };

  const handleRegister = () => {
    refreshLocalStorage();
    setProjectId(searchTerm.toLowerCase());
    window.location.href = '/register';
  }

  return (
    <div className="project-list-container">
      <div className="filters flex items-center gap-2 sm:gap-4 mb-4">
        {/* <Dropdown options={options} onSelect={(e) => setCategory(e.target.value)} /> */}
        <div className="search-container relative w-full">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full border rounded-2xl pl-3 sm:pl-4 pr-6 sm:pr-8 py-1 sm:py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-zinc-300 cursor-pointer flex justify-center items-center p-0.5 pl-[3px]"
            onClick={handleSearch}
          >
            <img src='/icons/search.svg' width={20} height={20} className='icon-search'/>
          </div>
          </div>
      </div>
      
      {filteredProjects.length > 0 ? (
        <div className="project-list py-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={index} config={project} />
          ))}
        </div>
      ) : (
        <div className="no-projects h-80 flex flex-col gap-6 justify-center items-center text-center py-4">
          {/* <p className="px-3 py-1 text-base sm:text-lg font-semibold border-2 border-zinc-700 rounded-lg">No projects found</p> */}
          <button 
            className="register-btn mr-2 px-3 sm:px-4 py-2 bg-black text-white text-2xl sm:text-3xl rounded-lg"
            onClick={handleRegister}
          >
            Register
          </button>
      </div>
      )}

      {isModalOpen && 
        <ProjectInfoModal id="project-info-modal" projectInfo={projectInfo} onClose={() => projectCardModalOpen.set(false)}/>
      } 
    </div>
  );
};

export default ProjectList;
