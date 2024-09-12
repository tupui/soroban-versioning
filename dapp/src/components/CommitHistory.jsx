import React from 'react';
import { useState, useEffect } from 'react';
import { getCommitHistory } from '../service/GithubService';
import CommitRecord from './CommitRecord.jsx';
import { formatDate } from '../service/utils';
import { loadProjectRepoInfo, loadConfigData } from '../service/StateService';
import { projectInfoLoaded } from '../utils/store.js';
import { useStore } from '@nanostores/react';

const CommitHistory = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [commitHistory, setCommitHistory] = useState([]);
  const [authors, setAuthors] = useState([]);

  const fetchCommitHistory = async () => {
    const projectRepoInfo = loadProjectRepoInfo();
    if (projectRepoInfo?.author && projectRepoInfo?.repository) {
      const history = await getCommitHistory(projectRepoInfo.author, projectRepoInfo.repository);
      setCommitHistory(history);
    }
  };
  
  const addMaintainerBadge = () => {
    const configData = loadConfigData();
    if (configData) {
      const authors = configData.authorGithubNames.map(name => name.toLowerCase());
      setAuthors(authors);
    } else {
      console.log("Can not read config data.");
    }
  }

  const loadCommitInfo = () => {
    if (isProjectInfoLoaded) {
      fetchCommitHistory();
      addMaintainerBadge();
    }
  }

  useEffect(() => {
    loadCommitInfo();
  }, [isProjectInfoLoaded]);

  return (
    <div className="commit-history-container max-h-[560px] overflow-auto relative pl-8">
      {commitHistory.map((day) => (
        <div key={day.date} className="day-group relative">
          <h3 className="text-lg font-semibold pb-4 relative before:content-[''] before:absolute before:-left-[1.5rem] before:top-0 before:bottom-0 before:w-0.5 before:bg-zinc-700">
            <div className="commit-dot absolute left-[-2.2rem] top-0 w-[25px] h-[25px] bg-[#f3f3f3] rounded-full before:content-[''] before:absolute before:left-[50%] before:top-[50%] before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:w-[15px] before:h-[15px] before:border-[2px] before:rounded-full"></div>
            <span className="pr-2 relative z-10">{formatDate(day.date)}</span>
          </h3>
          <div className="space-y-4 pb-4 relative before:content-[''] before:absolute before:-left-[1.5rem] before:top-0 before:bottom-0 before:w-0.5 before:bg-zinc-700">
            {day.commits.map((commit) => (
              <div key={commit.sha} className="relative">
                <CommitRecord
                  message={commit.message}
                  date={commit.commit_date}
                  authorName={commit.author.name}
                  authorGithubLink={commit.author.html_url}
                  sha={commit.sha}
                  commitLink={commit.html_url}
                  isMaintainer={authors ? authors.includes(commit.author.name.toLowerCase()) : false}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommitHistory;
