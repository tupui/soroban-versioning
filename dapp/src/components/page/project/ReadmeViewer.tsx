import { useStore } from "@nanostores/react";
import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { fetchReadmeContentFromConfigUrl } from "../../../service/GithubService";
import { loadProjectInfo, loadConfigData } from "../../../service/StateService";
import { projectInfoLoaded } from "../../../utils/store";
import DOMPurify from "dompurify";
import { getIpfsBasicLink } from "../../../utils/ipfsFunctions";

import "github-markdown-css";

const ReadmeViewer = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [readmeContent, setReadmeContent] = useState("");

  const loadReadme = async () => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();
      const configData = loadConfigData();

      if (projectInfo) {
        const projectType = configData?.projectType || "SOFTWARE";

        if (projectType === "SOFTWARE") {
          const configUrl = projectInfo.config.url;
          if (configUrl) {
            const readmeContent =
              await fetchReadmeContentFromConfigUrl(configUrl);
            if (readmeContent) {
              setReadmeContent(readmeContent);
            }
          }
        } else {
          try {
            const ipfsCid = projectInfo.config.ipfs;
            if (ipfsCid) {
              const readmeUrl = `${getIpfsBasicLink(ipfsCid)}/README.md`;
              const response = await fetch(readmeUrl);
              if (response.ok) {
                const content = await response.text();
                setReadmeContent(content);
              } else {
                setReadmeContent("No README available for this project.");
              }
            }
          } catch (error) {
            console.error("Error fetching README from IPFS:", error);
            setReadmeContent("Error loading README from IPFS.");
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
