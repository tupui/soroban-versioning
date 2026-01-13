import { useEffect, useState } from "react";
import type { ContributionMetrics as ContributionMetricsData } from "../../../types/contributionMetrics";
import { ContributionMetricsService } from "../../../service/ContributionMetricsService";
import { loadConfigData } from "../../../service/StateService";
import PonyFactorCard from "./PonyFactorCard";
import ContributorActivityChart from "./ContributorActivityChart";
import MonthlyActivityChart from "./MonthlyActivityChart";

interface ContributionMetricsProps {
  projectName: string;
  repoUrl: string;
}

const ContributionMetrics = ({
  projectName,
  repoUrl,
}: ContributionMetricsProps) => {
  const [metrics, setMetrics] = useState<ContributionMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintainers, setMaintainers] = useState<string[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const metrics = await ContributionMetricsService.fetchMetrics(repoUrl);
        setMetrics(metrics);

        const configData = loadConfigData();
        if (
          configData?.authorGithubNames &&
          Array.isArray(configData.authorGithubNames)
        ) {
          const maintainerNames = configData.authorGithubNames
            .map((name) =>
              name && typeof name === "string" ? name.toLowerCase() : "",
            )
            .filter(Boolean);
          setMaintainers(maintainerNames);
        }
      } catch (err) {
        console.error("Error fetching contribution metrics:", err);
        setError("Failed to load contribution metrics");
      } finally {
        setLoading(false);
      }
    };

    if (projectName && repoUrl) {
      fetchMetrics();
    }
  }, [projectName, repoUrl]);

  if (loading) {
    return (
      <div className="px-[16px] lg:px-[72px] flex flex-col gap-6">
        <div className="flex flex-col gap-[18px]">
          <p className="leading-6 text-2xl font-medium text-primary">
            Contribution Metrics
          </p>
          <div className="border-t border-[#EEEEEE]" />
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="px-[16px] lg:px-[72px] flex flex-col gap-6">
        <div className="flex flex-col gap-[18px]">
          <p className="leading-6 text-2xl font-medium text-primary">
            Contribution Metrics
          </p>
          <div className="border-t border-[#EEEEEE]" />
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">
            {error || "Unable to load contribution metrics"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[16px] lg:px-[72px] py-12 flex flex-col gap-6">
      <div className="flex flex-col gap-[18px]">
        <p className="leading-6 text-2xl font-medium text-primary">
          Contribution Metrics
        </p>
        <div className="border-t border-[#EEEEEE]" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-primary">
            {metrics.totalCommits}
          </div>
          <div className="text-sm text-secondary">Total Commits</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-primary">
            {metrics.totalContributors}
          </div>
          <div className="text-sm text-secondary">Total Contributors</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-primary">
            {metrics.activeContributors}
          </div>
          <div className="text-sm text-secondary">Active (3 months)</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-primary">
            {metrics.repositoryTimespan.totalDays}
          </div>
          <div className="text-sm text-secondary">Days Active</div>
        </div>
      </div>

      <PonyFactorCard
        ponyFactor={metrics.ponyFactor}
        totalCommits={metrics.totalCommits}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContributorActivityChart
          contributors={metrics.contributorActivity}
          maintainers={maintainers}
        />
        <MonthlyActivityChart monthlyStats={metrics.monthlyStats} />
      </div>
    </div>
  );
};

export default ContributionMetrics;
