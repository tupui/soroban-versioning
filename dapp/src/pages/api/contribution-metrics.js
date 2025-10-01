import { exec } from 'child_process';
import pkg from 'js-sha3';
const { keccak256 } = pkg;

export const prerender = false;

// Fetch Git log data and process it for contribution metrics
function getGitLogData() {
  return new Promise((resolve, reject) => {
    exec('git log --pretty=format:"%H %an %ae %ad %s"', (err, stdout) => {
      if (err) reject(err);
      resolve(stdout.split("\n"));
    });
  });
}

// Process log data to calculate the metrics
function processLogData(logData) {
  const metrics = {
    totalCommits: 0,
    contributors: {},
    ponyFactor: 0,
    coAuthors: [],
  };

  logData.forEach((log) => {
    const [commitHash, authorName, authorEmail, date, message] = log.split(" ");
    metrics.totalCommits++;

    // Track contributor activity
    if (!metrics.contributors[authorName]) {
      metrics.contributors[authorName] = 1;
    } else {
      metrics.contributors[authorName]++;
    }

    // Find co-authors in commit message
    const coAuthorMatch = message.match(/Co-authored-by: (.+?) <(.+?)>/);
    if (coAuthorMatch) {
      metrics.coAuthors.push(coAuthorMatch[1]);
    }
  });

  // Calculate Pony Factor (simple example)
  metrics.ponyFactor = Object.values(metrics.contributors).reduce((a, b) => a + b, 0);

  return metrics;
}

export const POST = async ({ request }) => {
  try {
    if (request.headers.get('Content-Type') !== 'application/json') {
      return new Response(null, { status: 400 });
    }

    const body = await request.json();
    const { projectName } = body;

    // Ensure projectName is provided
    if (!projectName) {
      return new Response(
        JSON.stringify({ error: 'Project name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Git log data and process metrics
    const logData = await getGitLogData();
    const metrics = processLogData(logData);

    // Return the metrics as JSON
    return new Response(
      JSON.stringify({ metrics }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
