import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { getCommitHistory } from "../../../service/GithubService.ts";
import {
  loadConfigData,
  loadProjectRepoInfo,
} from "../../../service/StateService.ts";
import { formatDate } from "../../../utils/formatTimeFunctions.ts";
import { latestCommit, projectInfoLoaded } from "../../../utils/store.ts";
import CommitPeriod from "./CommitPeriod.jsx";
import CommitRecord from "./CommitRecord.jsx";

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
      <div className="px-[16px] lg:px-[72px] flex flex-col gap-12">
        <div className="flex flex-col gap-[18px]">
          <p className="leading-6 text-2xl font-medium text-primary">
            Commit History
          </p>
          <div className="border-t border-[#EEEEEE]" />
        </div>
        <div className="commit-history-container pl-[44px] lg:pl-[54px] max-h-[560px] flex flex-col gap-6 overflow-auto">
          {commitHistory.map((day) => (
            <div key={day.date} className="day-group flex flex-col gap-6">
              <h3 className="relative">
                <div className="absolute -left-[40px] lg:-left-[50px] top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#2D0F512E] rounded-full"></div>
                <span className="leading-6 text-lg text-primary">
                  {formatDate(day.date)}
                </span>
              </h3>
              <div className="space-y-4">
                {day.commits.map((commit) => (
                  <div key={commit.sha} className="relative">
                    <div className="absolute -left-[31px] lg:-left-[41px] w-[2px] h-full bg-[#2D0F510D]" />
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
        <CommitPeriod
          startDate={commitHistory[0]?.date}
          endDate={commitHistory[commitHistory.length - 1]?.date}
          currentPage={currentPage}
          onPageChange={(page) => fetchCommitHistory(page)}
        />
      </div>
    </>
  );
};

export default CommitHistory;
