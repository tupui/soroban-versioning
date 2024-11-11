import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import Markdown from "markdown-to-jsx";
import { projectInfoLoaded } from "../../../utils/store";
import { loadProjectInfo } from "../../../service/StateService";
import { fetchReadmeContentFromConfigUrl } from "../../../service/githubService";
import "github-markdown-css";

const ReadmeViewer = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [readmeContent, setReadmeContent] = useState("");

  const toggleHeight = () => {
    setIsExpanded(!isExpanded);
  };

  const loadReadme = async () => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();
      if (projectInfo) {
        const configUrl = projectInfo.config.url;
        if (configUrl) {
          const readmeContent =
            await fetchReadmeContentFromConfigUrl(configUrl);
          if (readmeContent) {
            setReadmeContent(readmeContent);
            console.log("readmeContent:", readmeContent);
          }
        }
      }
    }
  };

  useEffect(() => {
    loadReadme();
  }, [isProjectInfoLoaded]);

  return (
    <div
      className={`transition-all duration-300 ${isExpanded ? "max-h-max" : "max-h-24"} overflow-hidden flex flex-col bg-white border border-zinc-400 rounded-xl`}
    >
      <div className="w-full py-3 sm:py-4 px-4 sm:px-6 md:px-8">
        <div
          onClick={toggleHeight}
          className="w-fit flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-300 cursor-pointer"
        >
          <span className="text-sm sm:text-base md:text-lg">README</span>
          <img
            src="/icons/arrow-up.svg"
            alt="Arrow up"
            className={`${isExpanded ? "block" : "hidden"}`}
          />
          <img
            src="/icons/arrow-down.svg"
            alt="Arrow down"
            className={`${isExpanded ? "hidden" : "block"}`}
          />
        </div>
      </div>
      <div className="w-full border-b border-zinc-400"></div>
      <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
        <Markdown>{readmeContent}</Markdown>
      </div>
    </div>
  );
};

export default ReadmeViewer;
