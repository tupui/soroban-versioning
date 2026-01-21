import React, { useState, useEffect } from "react";
import OrganizationCard from "./OrganizationCard";
import CreateOrganizationModal from "./CreateOrganizationModal";
import {
  getOrganizations,
  getOrganizationProjectsCount,
} from "../../../service/OrganizationService";
import Spinner from "../../utils/Spinner";
import Button from "../../utils/Button";

const OrganizationsList: React.FC = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>(
    {},
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoading(true);
        const orgs = await getOrganizations(currentPage);
        console.log("Loaded organizations:", orgs);
        setOrganizations(orgs);

        // Load project counts for each organization
        const counts: Record<string, number> = {};
        for (const org of orgs) {
          try {
            const count = await getOrganizationProjectsCount(org.name);
            counts[org.name] = count;
          } catch (_error) {
            console.error("Error loading project count:", _error);
            counts[org.name] = 0;
          }
        }
        setProjectCounts(counts);
      } catch (error) {
        console.error("Error loading organizations:", error);
        // Set empty array on error to show "no organizations" message
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizations();
  }, [currentPage]);

  const handleOrganizationClick = (organizationName: string) => {
    window.location.href = `/organization?name=${encodeURIComponent(organizationName)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-4">
            Organizations
          </h1>
          <p className="text-lg text-secondary">
            Browse organizations and their projects
          </p>
        </div>
        <Button
          onClick={() => {
            console.log("Create Organization button clicked");
            setShowCreateModal(true);
          }}
        >
          Create Organization
        </Button>
      </div>

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => {
            console.log("Closing modal");
            setShowCreateModal(false);
          }}
        />
      )}
      {showCreateModal && console.log("Modal should be visible now")}

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary">No organizations found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {organizations.map((org, index) => (
              <OrganizationCard
                key={index}
                organization={org}
                projectCount={projectCounts[org.name]}
                onClick={() => handleOrganizationClick(org.name)}
              />
            ))}
          </div>

          {/* Pagination */}
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
              disabled={organizations.length < 10}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationsList;
