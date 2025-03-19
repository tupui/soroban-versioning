import { useStore } from "@nanostores/react";
import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { fetchReadmeContentFromConfigUrl } from "../../../service/GithubService";
import { loadProjectInfo } from "../../../service/StateService";
import { projectInfoLoaded } from "../../../utils/store";

import "github-markdown-css";

const ReadmeViewer = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [readmeContent, setReadmeContent] = useState("");

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
          }
        }
      }
    }
  };

  useEffect(() => {
    loadReadme();
  }, [isProjectInfoLoaded]);

  return (
    <div className="flex flex-col">
      <div className="markdown-body max-h-80 overflow-auto">
        <Markdown>{readmeContent}</Markdown>
      </div>
    </div>
  );
};

export default ReadmeViewer;
