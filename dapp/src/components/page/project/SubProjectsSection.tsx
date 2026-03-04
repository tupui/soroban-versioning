import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { projectHasSubProjects, projectInfoLoaded } from "utils/store";
import { loadProjectInfo } from "@service/StateService";
import { getProjectFromId } from "@service/ReadContractService";
import { deriveProjectKey, normalizeSubProjectKeys } from "utils/projectKey";
import Tansu from "contracts/soroban_tansu";
import { checkSimulationError } from "utils/contractErrors";
import { fetchTomlFromCid } from "utils/ipfsFunctions";
import { extractConfigData } from "utils/utils";
import ProjectCard from "../dashboard/ProjectCard";

const SubProjectsSection = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [subProjects, setSubProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isProjectInfoLoaded) return;

    function showCommitHistoryAndMetrics() {
      const commitHistorySection = document.getElementById(
        "commit-history-section",
      );
      const contributionMetricsSection = document.getElementById(
        "contribution-metrics-section",
      );
      if (commitHistorySection) commitHistorySection.style.display = "block";
      if (contributionMetricsSection)
        contributionMetricsSection.style.display = "block";
    }

    const loadSubProjects = async () => {
      try {
        setIsLoading(true);
        const projectInfo = loadProjectInfo();
        if (!projectInfo) {
          setIsLoading(false);
          return;
        }

        const projectKey = deriveProjectKey(projectInfo.name);

        // Check if method exists (contract might not be deployed yet)
        if (typeof (Tansu as any).get_sub_projects !== "function") {
          projectHasSubProjects.set(false);
          setSubProjects([]);
          setIsLoading(false);
          showCommitHistoryAndMetrics();
          return;
        }

        const res = await (Tansu as any).get_sub_projects({
          project_key: projectKey,
        });
        checkSimulationError(res);

        const subProjectKeys = normalizeSubProjectKeys(res.result);
        if (subProjectKeys.length === 0) {
          projectHasSubProjects.set(false);
          setSubProjects([]);
          setIsLoading(false);
          showCommitHistoryAndMetrics();
          return;
        }

        projectHasSubProjects.set(true);

        // When sub-projects exist, hide commit history and contribution metrics.
        const commitHistorySection = document.getElementById(
          "commit-history-section",
        );
        const contributionMetricsSection = document.getElementById(
          "contribution-metrics-section",
        );
        if (commitHistorySection) commitHistorySection.style.display = "none";
        if (contributionMetricsSection)
          contributionMetricsSection.style.display = "none";

        const results = await Promise.all(
          subProjectKeys.map(async (keyBuffer) => {
            try {
              const projectData = await getProjectFromId(keyBuffer);
              if (!projectData?.config?.ipfs) return null;
              const tomlData = await fetchTomlFromCid(projectData.config.ipfs);
              const configData = extractConfigData(tomlData || "", projectData);
              return { ...projectData, configData };
            } catch {
              return null;
            }
          }),
        );
        const projects = results.filter(
          (p): p is NonNullable<typeof p> => p !== null,
        );
        setSubProjects(projects);
      } catch {
        projectHasSubProjects.set(false);
        setSubProjects([]);
        showCommitHistoryAndMetrics();
      } finally {
        setIsLoading(false);
      }
    };

    loadSubProjects();
  }, [isProjectInfoLoaded]);

  if (isLoading) {
    return (
      <div className="px-[16px] lg:px-[72px] py-12">
        <p className="text-secondary">Loading sub-projects...</p>
      </div>
    );
  }

  if (subProjects.length === 0) {
    return null;
  }

  return (
    <div className="px-[16px] lg:px-[72px] py-12 bg-white">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-[18px]">
          <p className="leading-6 text-2xl font-medium text-primary">
            Sub-Projects
          </p>
          <div className="border-t border-[#EEEEEE]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subProjects.map((project, index) => {
            const config = {
              projectName: project.name,
              description: project.configData?.description || "",
              logoImageLink: project.configData?.logoImageLink || null,
              officials: {
                websiteLink: project.configData?.officials?.websiteLink,
                githubLink:
                  project.config?.url ||
                  project.configData?.officials?.githubLink,
              },
              socialLinks: project.configData?.socialLinks || {},
              organizationName: project.configData?.organizationName,
            };

            return (
              <div
                key={project.name}
                onClick={() => {
                  window.location.href = `/project?name=${encodeURIComponent(project.name)}`;
                }}
                className="cursor-pointer"
              >
                <ProjectCard config={config} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubProjectsSection;
