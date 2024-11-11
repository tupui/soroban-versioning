import React from "react";
import { useState, useEffect } from "react";
import CommitRecord from "./CommitRecord.jsx";
import { formatDate } from "../../../utils/formatTimeFunctions.ts";
import { projectInfoLoaded, latestCommit } from "../../../utils/store.js";
import {
  loadProjectRepoInfo,
  loadConfigData,
} from "@service/StateService";
import { getCommitHistory } from "@service/GithubService";
import { useStore } from "@nanostores/react";

const CommitHistory = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [commitHistory, setCommitHistory] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCommitHistory = async (page = 1) => {
    const projectRepoInfo = loadProjectRepoInfo();
    if (projectRepoInfo?.author && projectRepoInfo?.repository) {
      const history = await getCommitHistory(
        projectRepoInfo.author,
        projectRepoInfo.repository,
        page,
      );
      setCommitHistory(history);
      setCurrentPage(page);

      // Set the latest commit
      if (history.length > 0 && history[0].commits.length > 0) {
        latestCommit.set(history[0].commits[0].sha);
      }
    }
  };

  const addMaintainerBadge = () => {
    const configData = loadConfigData();
    if (
      configData.authorGithubNames &&
      configData.authorGithubNames.length > 0
    ) {
      const authors = configData.authorGithubNames.map((name) =>
        name.toLowerCase(),
      );
      setAuthors(authors);
    } else {
      console.log("Cannot read config data.");
    }
  };

  const loadCommitInfo = () => {
    if (isProjectInfoLoaded) {
      fetchCommitHistory();
      addMaintainerBadge();
    }
  };

  useEffect(() => {
    loadCommitInfo();
  }, [isProjectInfoLoaded]);

  return (
    <>
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
                    isMaintainer={
                      authors
                        ? authors.includes(commit.author.name.toLowerCase())
                        : false
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination  */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => fetchCommitHistory(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>
        <button
          onClick={() => fetchCommitHistory(1)}
          className={`px-3 py-1 border rounded hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 ${
            currentPage === 1
              ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 active:bg-blue-700"
              : "border-zinc-300"
          }`}
        >
          1
        </button>
        {currentPage > 2 && <span>...</span>}
        {currentPage !== 1 && (
          <button className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded">
            {currentPage}
          </button>
        )}
        <button
          onClick={() => fetchCommitHistory(currentPage + 1)}
          disabled={false}
          className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 flex items-center"
        >
          Next
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default CommitHistory;
