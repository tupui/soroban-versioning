import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { projectInfoLoaded } from "utils/store";
import { loadProjectInfo } from "@service/StateService";
import { deriveProjectKey } from "utils/projectKey";
import Tansu from "contracts/soroban_tansu";
import { checkSimulationError } from "utils/contractErrors";
import { fetchTomlFromCid } from "utils/ipfsFunctions";
import { extractConfigData } from "utils/utils";
import ProjectCard from "../dashboard/ProjectCard";
import { Buffer } from "buffer";

const SubProjectsSection = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [subProjects, setSubProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isProjectInfoLoaded) return;

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
          setSubProjects([]);
          setIsLoading(false);
          // Show commit history and contribution metrics
          const commitHistorySection = document.getElementById(
            "commit-history-section",
          );
          const contributionMetricsSection = document.getElementById(
            "contribution-metrics-section",
          );
          const latestCommitSection = document.getElementById(
            "latest-commit-section",
          );
          if (commitHistorySection)
            commitHistorySection.style.display = "block";
          if (contributionMetricsSection)
            contributionMetricsSection.style.display = "block";
          if (latestCommitSection) latestCommitSection.style.display = "block";
          return;
        }

        const res = await (Tansu as any).get_sub_projects({
          project_key: projectKey,
        });
        checkSimulationError(res);

        const subProjectKeys = res.result || [];
        if (subProjectKeys.length === 0) {
          setSubProjects([]);
          setIsLoading(false);
          // Show commit history and contribution metrics
          const commitHistorySection = document.getElementById(
            "commit-history-section",
          );
          const contributionMetricsSection = document.getElementById(
            "contribution-metrics-section",
          );
          const latestCommitSection = document.getElementById(
            "latest-commit-section",
          );
          if (commitHistorySection)
            commitHistorySection.style.display = "block";
          if (contributionMetricsSection)
            contributionMetricsSection.style.display = "block";
          if (latestCommitSection) latestCommitSection.style.display = "block";
          return;
        }

        // Hide commit history and contribution metrics when sub-projects exist
        const commitHistorySection = document.getElementById(
          "commit-history-section",
        );
        const contributionMetricsSection = document.getElementById(
          "contribution-metrics-section",
        );
        const latestCommitSection = document.getElementById(
          "latest-commit-section",
        );
        if (commitHistorySection) commitHistorySection.style.display = "none";
        if (contributionMetricsSection)
          contributionMetricsSection.style.display = "none";
        if (latestCommitSection) latestCommitSection.style.display = "none";

        const projects: any[] = [];
        for (const key of subProjectKeys) {
          try {
            const keyBuffer = Buffer.isBuffer(key)
              ? key
              : Buffer.from(key, "hex");
            const project = await Tansu.get_project({
              project_key: keyBuffer,
            });
            checkSimulationError(project);

            if (project.result) {
              const projectData = project.result;
              const tomlData = await fetchTomlFromCid(projectData.config.ipfs);
              const configData = extractConfigData(tomlData || "", projectData);
              projects.push({
                ...projectData,
                configData,
              });
            }
          } catch {
            // Silently handle errors loading individual sub-projects
          }
        }

        setSubProjects(projects);
      } catch {
        setSubProjects([]);
        // Show commit history and contribution metrics on error
        const commitHistorySection = document.getElementById(
          "commit-history-section",
        );
        const contributionMetricsSection = document.getElementById(
          "contribution-metrics-section",
        );
        const latestCommitSection = document.getElementById(
          "latest-commit-section",
        );
        if (commitHistorySection) commitHistorySection.style.display = "block";
        if (contributionMetricsSection)
          contributionMetricsSection.style.display = "block";
        if (latestCommitSection) latestCommitSection.style.display = "block";
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
                key={index}
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
