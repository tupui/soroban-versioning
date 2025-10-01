import { useEffect, useState } from 'react';

const ContributionMetrics = ({ projectName }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);  // Added loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);  // Set loading true before fetch
        const response = await fetch("/api/contribution-metrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectName }),
        });

        const data = await response.json();
        console.log("Fetched data: ", data);

        // Check if we have valid data and update state
        if (data && data.metrics) {
          setMetrics(data.metrics);  // Set the fetched data
        } else {
          setError("No data available for this project.");
        }
      } catch (error) {
        setError("Error fetching contribution metrics.");
        console.error(error);  // Log the error for debugging
      } finally {
        setLoading(false);  // Stop loading once the request is finished
      }
    };

    if (projectName) {
      fetchMetrics();
    }
  }, [projectName]);

  if (loading) {
    return <div>Loading contribution metrics...</div>;
  }

  if (error) {
    return <div>{error}</div>;  // Show error message if there is any
  }

  return (
    <div className="contribution-metrics">
      <h3>Contribution Metrics</h3>
      <p>Total Commits: {metrics.totalCommits}</p>
      <p>Pony Factor: {metrics.ponyFactor}</p>
      <div>
        <h4>Top Contributors</h4>
        <ul>
          {Object.keys(metrics.contributors).map((contributor) => (
            <li key={contributor}>
              {contributor}: {metrics.contributors[contributor]} commits
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Co-authors</h4>
        <ul>
          {metrics.coAuthors.map((coAuthor, index) => (
            <li key={index}>{coAuthor}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ContributionMetrics;
