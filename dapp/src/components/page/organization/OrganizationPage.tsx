import { useState, useEffect } from "react";
import ProjectCard from "../dashboard/ProjectCard";
import {
  getOrganization,
  getOrganizationProjects,
} from "../../../service/OrganizationService";
import { extractConfigData } from "../../../utils/utils";
import { fetchTomlFromCid } from "../../../utils/ipfsFunctions";
import Spinner from "../../utils/Spinner";

const OrganizationPage: React.FC = () => {
  const [organization, setOrganization] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [configData, setConfigData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const loadOrganization = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const organizationName = urlParams.get("name");
      if (!organizationName) return;

      try {
        setIsLoading(true);
        const org = await getOrganization(organizationName);
        setOrganization(org);

        // Load organization config from IPFS
        if (org.config?.ipfs) {
          const tomlData = await fetchTomlFromCid(org.config.ipfs);
          if (tomlData) {
            setConfigData(
              extractConfigData(tomlData, {
                name: org.name,
                config: org.config,
                maintainers: org.maintainers,
                organization_key: null,
              }),
            );
          }
        }

        // Load projects
        const orgProjects = await getOrganizationProjects(
          organizationName,
          currentPage,
        );
        setProjects(orgProjects);
      } catch (_error) {
        console.error("Error loading organization:", _error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Organization not found
          </h1>
          <button
            onClick={() => (window.location.href = "/")}
            className="text-primary hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Organization Header */}
      <div className="mb-8">
        {configData?.logoImageLink && (
          <img
            src={configData.logoImageLink}
            alt={configData.organizationName || organization.name}
            className="w-24 h-24 rounded-lg object-cover mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <h1 className="text-4xl font-bold text-primary mb-2">
          {configData?.organizationName || organization.name}
        </h1>
        {configData?.description && (
          <p className="text-lg text-secondary mb-4">
            {configData.description}
          </p>
        )}
        {configData?.officials?.websiteLink && (
          <a
            href={configData.officials.websiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Visit website →
          </a>
        )}
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary">
              No projects found in this organization.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              // Extract config data for each project
              const projectConfig = extractConfigData(null, project);
              return (
                <div
                  key={index}
                  onClick={() =>
                    (window.location.href = `/project?name=${project.name}`)
                  }
                >
                  <ProjectCard config={projectConfig} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {projects.length > 0 && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {currentPage + 1}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={projects.length < 10}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
