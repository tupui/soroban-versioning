import type { PonyFactorResult } from "../../../types/contributionMetrics";

interface PonyFactorCardProps {
  ponyFactor: PonyFactorResult;
  totalCommits: number;
}

const PonyFactorCard: React.FC<PonyFactorCardProps> = ({
  ponyFactor,
  totalCommits,
}) => {
  const getRiskLevel = (
    factor: number,
  ): { level: string; color: string; description: string } => {
    if (factor <= 2) {
      return {
        level: "High Risk",
        color: "text-red-600 bg-red-50 border-red-200",
        description:
          "Very few contributors control most of the codebase. Consider encouraging more diverse contributions.",
      };
    } else if (factor <= 5) {
      return {
        level: "Medium Risk",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        description:
          "A small group controls most contributions. Good, but could benefit from broader participation.",
      };
    } else {
      return {
        level: "Low Risk",
        color: "text-green-600 bg-green-50 border-green-200",
        description:
          "Well-distributed contributions across multiple contributors. Excellent bus factor!",
      };
    }
  };

  const risk = getRiskLevel(ponyFactor.factor);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Pony Factor</h3>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${risk.color}`}
          >
            {risk.level}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-primary">
            {ponyFactor.factor}
          </div>
          <div className="flex-1">
            <div className="text-sm text-secondary mb-1">
              {ponyFactor.explanation}
            </div>
            <div className="text-xs text-gray-500">{risk.description}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-secondary mb-2">
            Top Contributors (50% of commits)
          </div>
          <div className="space-y-2">
            {ponyFactor.topContributors
              .slice(0, 5)
              .map((contributor, index) => {
                const percentage =
                  totalCommits > 0
                    ? (contributor.commitCount / totalCommits) * 100
                    : 0;
                const contributorKey = `${contributor.author.name}-${contributor.author.email || "no-email"}`;
                return (
                  <div
                    key={contributorKey}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="text-sm text-primary">
                        {contributor.author.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary">
                        {contributor.commitCount} commits
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <strong>What is Pony Factor?</strong> The minimum number of
            contributors whose removal would leave the project in a critical
            state. Based on the principle that if key contributors were "hit by
            a pony" (bus factor), how many would need to be replaced?{" "}
            <a
              href="https://ke4qqq.wordpress.com/2015/02/08/pony-factor-math/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Learn more ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PonyFactorCard;
