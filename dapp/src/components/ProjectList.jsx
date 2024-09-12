import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard.jsx';
import { getDemoConfigData } from '../constants/demoConfigData.js';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      // Simulating an async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      const data = getDemoConfigData();
      setProjects(data);
    };

    fetchProjects();
  }, []);

  return (
    <div className="project-list py-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
      {projects.map((project, index) => (
        <ProjectCard key={index} config={project} />
      ))}
    </div>
  );
};

export default ProjectList;
