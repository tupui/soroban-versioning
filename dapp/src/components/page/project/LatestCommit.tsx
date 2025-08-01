import { useStore } from "@nanostores/react";
import { getLatestCommitData } from "@service/GithubService";
import { getProjectHash } from "@service/ReadContractService";
import { loadProjectInfo } from "@service/StateService";
import Tooltip from "components/utils/Tooltip";
import CopyButton from "components/utils/CopyButton";
import { useEffect, useState } from "react";
import { formatDate } from "utils/formatTimeFunctions";
import { projectInfoLoaded } from "utils/store";
import { getIpfsBasicLink } from "utils/ipfsFunctions";

enum Status {
  Match,
  NotMatch,
  NotFound,
}

const LatestCommit = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [commitData, setCommitData] = useState<any>();
  const [latestCommitStatus, setLatestCommitStatus] = useState<Status>(
    Status.NotFound,
  );

  const loadLatestCommitData = async () => {
    const projectInfo = loadProjectInfo();
    const latestSha = await getProjectHash();
    if (projectInfo && latestSha) {
      const latestCommit = await getLatestCommitData(
        projectInfo.config.url,
        latestSha,
      );
      setCommitData(latestCommit);
      if (latestCommit.sha === latestSha) {
        setLatestCommitStatus(Status.Match);
      } else {
        setLatestCommitStatus(Status.NotMatch);
      }
    }
  };

  useEffect(() => {
    loadLatestCommitData();
  }, [isProjectInfoLoaded]);

  return (
    <div className="flex flex-col gap-3">
      {commitData && (
        <div className="flex gap-2">
          <p className="text-base text-tertiary">Latest Commit:</p>
          <p className="text-base font-bold text-primary">
            {commitData?.commit.message}
          </p>
        </div>
      )}
      <div className="flex gap-[18px]">
        {commitData && (
          <div className="p-[8px_18px] flex items-center gap-[18px] bg-[#FFEFA8]">
            <p className="text-lg text-primary">
              {commitData?.sha.slice(0, 9)}
            </p>
            <div className="flex gap-2">
              <CopyButton textToCopy={commitData?.html_url || ""} size="sm" />
              <a
                href={commitData?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-gray-100 p-1 rounded transition-colors duration-200"
              >
                <img src="/icons/link.svg" alt="Open link" />
              </a>
            </div>
          </div>
        )}
        <div className="flex gap-[18px]">
          <div className="flex items-center gap-2">
            <div className="flex gap-[6px]">
              {latestCommitStatus == Status.Match ? (
                <img src="/icons/check.svg" />
              ) : (
                <img src="/icons/failed.svg" />
              )}
              <p className="text-base text-medium text-[#07711E]">
                Commit Hash
              </p>
            </div>
            <Tooltip
              text={
                latestCommitStatus == Status.Match
                  ? "Latest SHA on-chain exists on GitHub"
                  : "Latest SHA on-chain cannot be found on GitHub"
              }
            >
              <img src="/icons/info.svg" />
            </Tooltip>
          </div>
        </div>
      </div>
      {commitData && (
        <div className="flex gap-3">
          <p className="text-base font-semibold text-primary">
            @{commitData?.commit.author.name}
          </p>
          <p className="text-base text-primary">committed on</p>
          <p className="text-base font-semibold text-primary">
            {formatDate(commitData?.commit.committer.date)}
          </p>
        </div>
      )}
      {/* Configuration link */}
      {isProjectInfoLoaded && (
        <a
          href={`${getIpfsBasicLink(loadProjectInfo()?.config.hash || "")}/tansu.toml`}
          target="_blank"
          className="flex items-center gap-1 text-[#07711E] hover:underline"
        >
          <img src="/icons/ipfs.svg" className="w-4 h-4" />
          <span className="text-base">tansu.toml</span>
        </a>
      )}
    </div>
  );
};

export default LatestCommit;
