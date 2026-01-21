import React from "react";
import { extractConfigData } from "../../../utils/utils";
import { fetchTomlFromCid } from "../../../utils/ipfsFunctions";
import type { Project } from "../../../../packages/tansu";

interface OrganizationCardProps {
  organization: {
    name: string;
    config: {
      ipfs: string;
    };
    maintainers: string[];
  };
  projectCount?: number;
  onClick?: () => void;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  projectCount,
  onClick,
}) => {
  const [configData, setConfigData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const tomlData = await fetchTomlFromCid(organization.config.ipfs);
        if (tomlData) {
          // Create a mock project object for extractConfigData
          const mockProject: Project = {
            name: organization.name,
            config: {
              url: "",
              ipfs: organization.config.ipfs,
            },
            maintainers: organization.maintainers.map((addr) => addr as any),
            organization_key: null,
          };
          setConfigData(extractConfigData(tomlData, mockProject));
        }
      } catch (error) {
        console.error("Error loading organization config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (organization.config.ipfs) {
      loadConfig();
    } else {
      setIsLoading(false);
    }
  }, [organization]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {configData?.logoImageLink && (
          <img
            src={configData.logoImageLink}
            alt={configData.organizationName || organization.name}
            className="w-16 h-16 rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-primary mb-2">
            {configData?.organizationName || organization.name}
          </h3>
          {configData?.description && (
            <p className="text-sm text-secondary mb-4 line-clamp-2">
              {configData.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-secondary">
            {projectCount !== undefined && (
              <span>
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </span>
            )}
            {configData?.officials?.websiteLink && (
              <a
                href={configData.officials.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationCard;
