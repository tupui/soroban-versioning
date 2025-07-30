import { useEffect, useState, useCallback } from "react";
import type { FC } from "react";
import Modal from "components/utils/Modal";
import { fetchReadmeContentFromConfigUrl } from "../../../service/GithubService";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";
import Button from "components/utils/Button";
import CopyButton from "components/utils/CopyButton";

interface ReadMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData?: {
    name: string;
    description: string;
    organization: string;
    logoImageLink: string;
    githubUrl: string;
    websiteUrl?: string;
  };
}

const markdownOverrides = {
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
};

const ReadMoreModal: FC<ReadMoreModalProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [readmeContent, setReadmeContent] = useState("");

  useEffect(() => {
    const loadReadme = async () => {
      if (isOpen && projectData?.githubUrl) {
        try {
          const content = await fetchReadmeContentFromConfigUrl(
            projectData.githubUrl,
          );
          if (content) {
            setReadmeContent(content);
          }
        } catch (error) {
          console.error("Failed to load README:", error);
          setReadmeContent(
            "Failed to load README content. Please check the repository directly.",
          );
        }
      }
    };

    loadReadme();

    // Clear content when modal is closed
    return () => {
      if (!isOpen) {
        setReadmeContent("");
      }
    };
  }, [isOpen, projectData?.githubUrl]);

  const handleGoToReleases = useCallback(() => {
    if (projectData?.githubUrl) {
      window.open(`${projectData.githubUrl}/releases`, "_blank");
    }
  }, [projectData?.githubUrl]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center sm:items-start gap-4 sm:gap-6">
        <img
          className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] lg:w-[150px] lg:h-[150px]"
          alt="Project thumbnail"
          src={projectData?.logoImageLink || ""}
        />
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          <div className="flex flex-col gap-2 sm:gap-3">
            <p className="leading-4 text-sm sm:text-base text-secondary text-center sm:text-left">
              {projectData?.organization || ""}
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-[18px]">
              <p className="text-xl sm:text-2xl text-primary text-center sm:text-left">
                {projectData?.name || ""}
              </p>
              <div className="flex items-center gap-3">
                {projectData?.githubUrl && (
                  <a
                    href={projectData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/icons/logos/github.svg"
                      alt="GitHub"
                      className="w-4 h-4"
                    />
                  </a>
                )}
                {projectData?.websiteUrl && (
                  <a
                    href={projectData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/icons/logos/web.svg"
                      alt="Website"
                      className="w-4 h-4"
                    />
                  </a>
                )}
              </div>
            </div>
            <p className="text-sm sm:text-base text-primary text-center sm:text-left max-w-full break-words">
              {projectData?.description || ""}
            </p>
          </div>

          <div className="relative flex flex-col items-center w-full">
            <div className="flex flex-col gap-4 sm:gap-6 w-full">
              <div className="flex max-sm:flex-col gap-2 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <CopyButton
                    textToCopy={
                      projectData?.githubUrl
                        ? `git clone ${projectData.githubUrl}`
                        : ""
                    }
                    showText={true}
                    text="Clone Repository"
                    className="w-full sm:w-auto p-2 sm:p-[9px_30px] lg:p-[18px_30px] bg-[#F5F1F9]"
                  />
                </div>
                <button
                  onClick={handleGoToReleases}
                  className="p-2 sm:p-[9px_30px] lg:p-[18px_30px] bg-[#F5F1F9] flex items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto"
                >
                  <img
                    src="/icons/link.svg"
                    className="w-4 h-4 sm:w-auto sm:h-auto"
                    alt="External link"
                  />
                  <span className="leading-5 text-base sm:text-xl text-primary cursor-pointer">
                    Go to Releases
                  </span>
                </button>
              </div>
              <div className="markdown-body border border-gray-200 rounded h-auto max-h-[60vh] overflow-y-auto overflow-x-hidden p-4">
                <Markdown options={{ overrides: markdownOverrides }}>
                  {readmeContent}
                </Markdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReadMoreModal;
