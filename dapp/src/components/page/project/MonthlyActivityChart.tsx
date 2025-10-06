import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  monthlyStats,
}) => {
  const [metric, setMetric] = useState<"commits" | "contributors">("commits");
  const [timeRange, setTimeRange] = useState<"6m" | "12m" | "all">("12m");

  const months = Object.keys(monthlyStats).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const getFilteredMonths = () => {
    if (timeRange === "all") return months;
    const monthCount = timeRange === "6m" ? 6 : 12;
    return months.slice(-monthCount);
  };

  const filteredMonths = getFilteredMonths();

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    if (!year || !month) return monthKey;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const chartData = useMemo(() => {
    return filteredMonths.map((month) => ({
      month: formatMonth(month),
      value: monthlyStats[month]?.[metric] || 0,
      fullDate: month,
    }));
  }, [filteredMonths, monthlyStats, metric]);

  const getTotalForPeriod = () => {
    return filteredMonths.reduce((sum, month) => {
      return sum + (monthlyStats[month]?.[metric] || 0);
    }, 0);
  };

  const getAverageForPeriod = () => {
    const total = getTotalForPeriod();
    return filteredMonths.length > 0
      ? Math.round(total / filteredMonths.length)
      : 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">
            Monthly Activity
          </h3>
          <div className="flex gap-2 flex-wrap">
            <select
              value={metric}
              onChange={(e) =>
                setMetric(e.target.value as "commits" | "contributors")
              }
              className="px-3 py-1 text-xs border border-gray-300 rounded-md bg-white"
            >
              <option value="commits">Commits</option>
              <option value="contributors">Contributors</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as "6m" | "12m" | "all")
              }
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
            <div className="text-2xl font-bold text-primary">
              {getTotalForPeriod()}
            </div>
            <div className="text-xs text-secondary">Total {metric}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {getAverageForPeriod()}
            </div>
            <div className="text-xs text-secondary">Monthly average</div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-[250px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={{ stroke: "#9ca3af" }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={{ stroke: "#9ca3af" }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#ffffff",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number) => [
                    value,
                    metric === "commits" ? "Commits" : "Contributors",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#8b5cf6" }}
                  activeDot={{
                    r: 6,
                    stroke: "#a78bfa",
                    strokeWidth: 2,
                    fill: "#8b5cf6",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-secondary text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyActivityChart;
