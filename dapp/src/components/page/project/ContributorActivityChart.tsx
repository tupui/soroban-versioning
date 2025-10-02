import { useState } from "react";
import type { ContributorActivity } from "../../../types/contributionMetrics";

interface ContributorActivityChartProps {
  contributors: ContributorActivity[];
  maintainers?: string[];
}

const ContributorActivityChart: React.FC<ContributorActivityChartProps> = ({
  contributors,
  maintainers = []
}) => {
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'commits' | 'recent'>('commits');

  const sortedContributors = [...contributors].sort((a, b) => {
    if (sortBy === 'commits') {
      return b.commitCount - a.commitCount;
    } else {
      return new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime();
    }
  });

  const displayedContributors = showAll ? sortedContributors : sortedContributors.slice(0, 5);
  const maxCommits = Math.max(...contributors.map(c => c.commitCount), 1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const getActivityStatus = (lastCommit: string) => {
    const lastCommitDate = new Date(lastCommit);
    const now = new Date();
    const diffMonths = (now.getFullYear() - lastCommitDate.getFullYear()) * 12 +
                      (now.getMonth() - lastCommitDate.getMonth());

    if (diffMonths <= 1) return { status: 'Active', color: 'bg-green-500' };
    if (diffMonths <= 3) return { status: 'Recent', color: 'bg-yellow-500' };
    return { status: 'Inactive', color: 'bg-gray-400' };
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Contributor Activity</h3>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'commits' | 'recent')}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md bg-white"
            >
              <option value="commits">Sort by Commits</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {displayedContributors.map((contributor) => {
            const percentage = (contributor.commitCount / maxCommits) * 100;
            const activity = getActivityStatus(contributor.lastCommit);
            const isMaintainer = maintainers.includes(contributor.author.name.toLowerCase());
            const contributorKey = `${contributor.author.name}-${contributor.author.email || 'no-email'}`;

            return (
              <div key={contributorKey} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${activity.color}`} title={activity.status} />
                    <span className="text-sm font-medium text-primary truncate">
                      {contributor.author.name}
                    </span>
                    {isMaintainer && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        maintainer
                      </span>
                    )}
                    <span className="text-xs text-secondary">{contributor.commitCount} commits</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span>First: {formatDate(contributor.firstCommit)}</span>
                    <span>•</span>
                    <span>Last: {formatDate(contributor.lastCommit)}</span>
                  </div>

                  <div className="mt-1 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {contributors.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            {showAll ? 'Show Less' : `Show All ${contributors.length} Contributors`}
          </button>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-secondary">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Active (≤1 month)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Recent (≤3 months)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Inactive (3 months)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorActivityChart;