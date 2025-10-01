import { useState } from "react";

interface MonthlyStats {
  [month: string]: {
    commits: number;
    contributors: number;
    linesChanged: number;
  };
}

interface MonthlyActivityChartProps {
  monthlyStats: MonthlyStats;
}

const MonthlyActivityChart: React.FC<MonthlyActivityChartProps> = ({
  monthlyStats
}) => {
  const [metric, setMetric] = useState<'commits' | 'contributors'>('commits');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('12m');

  const months = Object.keys(monthlyStats).sort();

  const getFilteredMonths = () => {
    if (timeRange === 'all') return months;

    const monthsToShow = timeRange === '6m' ? 6 : 12;
    return months.slice(-monthsToShow);
  };

  const filteredMonths = getFilteredMonths();
  const maxValue = Math.max(
    ...filteredMonths.map(month => monthlyStats[month]?.[metric] || 0),
    1
  );

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    if (!year || !month) return monthKey;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  const getTotalForPeriod = () => {
    return filteredMonths.reduce((sum, month) => {
      return sum + (monthlyStats[month]?.[metric] || 0);
    }, 0);
  };

  const getAverageForPeriod = () => {
    const total = getTotalForPeriod();
    return filteredMonths.length > 0 ? Math.round(total / filteredMonths.length) : 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">Monthly Activity</h3>
          <div className="flex gap-2 flex-wrap">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as 'commits' | 'contributors')}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md bg-white"
            >
              <option value="commits">Commits</option>
              <option value="contributors">Contributors</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '6m' | '12m' | 'all')}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md bg-white"
            >
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getTotalForPeriod()}</div>
            <div className="text-xs text-secondary">Total {metric}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getAverageForPeriod()}</div>
            <div className="text-xs text-secondary">Monthly average</div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="flex items-end justify-center gap-1 h-32 px-2">
            {filteredMonths.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-blue-800 text-sm">
                No data available
              </div>
            ) : (
              filteredMonths.map((month) => {
                if (!month) return null;
                const value = monthlyStats[month]?.[metric] || 0;
                const height = getBarHeight(value);

                return (
                  <div
                    key={month}
                    className="group relative flex flex-col items-center flex-1 max-w-8"
                  >
                    <div
                      className="w-full bg-violet-500 rounded-t-sm transition-all duration-300 hover:bg-violet-600"
                      style={{ height: value > 0 ? `${height}%` : '2px', minHeight: value > 0 ? '8px' : '2px' }}
                      title={`${formatMonth(month)}: ${value} ${metric}`}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {formatMonth(month)}: {value} {metric}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-center gap-1 mt-2 px-2">
            {filteredMonths.map((month, index) => {
              if (!month) return null;
              return (
                <div key={month} className="flex-1 max-w-8 text-center">
                  {index % Math.ceil(filteredMonths.length / 6) === 0 && (
                    <span className="text-xs text-secondary">{formatMonth(month)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend Analysis */}
        {filteredMonths.length >= 3 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-800">
              <strong>Trend:</strong> {getTrendAnalysis()}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getTrendAnalysis() {
    if (filteredMonths.length < 3) return "Not enough data for trend analysis";

    const recentMonths = filteredMonths.slice(-3);
    const earlierMonths = filteredMonths.slice(0, 3);

    const recentAvg = recentMonths.reduce((sum, month) =>
      sum + (monthlyStats[month]?.[metric] || 0), 0) / recentMonths.length;
    const earlierAvg = earlierMonths.reduce((sum, month) =>
      sum + (monthlyStats[month]?.[metric] || 0), 0) / earlierMonths.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (Math.abs(change) < 10) return "Activity levels are stable";
    if (change > 0) return `Activity is trending up by ${Math.round(change)}%`;
    return `Activity is trending down by ${Math.round(Math.abs(change))}%`;
  }
};

export default MonthlyActivityChart;