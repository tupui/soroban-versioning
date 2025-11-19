import { useStore } from "@nanostores/react";
import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { fetchReadmeContentFromConfigUrl } from "../../../service/RepositoryService";
import { loadProjectInfo } from "../../../service/StateService";
import { projectInfoLoaded } from "../../../utils/store";
import DOMPurify from "dompurify";

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
    <div className="markdown-body border border-gray-200 rounded h-auto max-h-[60vh] overflow-y-auto overflow-x-hidden p-4">
      <Markdown
        options={{
          overrides: {
            img: {
              props: {
                className: "max-w-full h-auto",
              },
            },
            table: {
              props: {
                className: "table-auto border-collapse max-w-full",
              },
            },
            th: {
              props: {
                className: "border border-gray-300 px-4 py-2",
              },
            },
            td: {
              props: {
                className: "border border-gray-300 px-4 py-2",
              },
            },
            pre: {
              props: {
                className: "max-w-full overflow-x-auto",
              },
            },
            code: {
              props: {
                className: "max-w-full overflow-x-auto",
              },
            },
          },
        }}
      >
        {DOMPurify.sanitize(readmeContent)}
      </Markdown>
    </div>
  );
};

export default ReadmeViewer;
