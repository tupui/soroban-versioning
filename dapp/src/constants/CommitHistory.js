const demoCommitHistory = [
  {
    date: "2023-04-15",
    commits: [
      {
        message: "Update README.md",
        author: { name: "John Doe", html_url: "https://github.com/johndoe" },
        commit_date: "2024-09-06T14:32:41Z",
        html_url: "https://github.com/user/repo/commit/1234567",
        sha: "1234567890abcdef1234567890abcdef12345678"
      },
      {
        message: "Fix bug in login component",
        author: { name: "Jane Smith", html_url: "https://github.com/janesmith" },
        commit_date: "2024-09-05T10:15:22Z",
        html_url: "https://github.com/user/repo/commit/abcdefg",
        sha: "abcdefg1234567890abcdefg1234567890abcdef"
      }
    ]
  },
  {
    date: "2023-04-14",
    commits: [
      {
        message: "Implement new feature",
        author: { name: "Alice Johnson", html_url: "https://github.com/alicejohnson" },
        commit_date: "2024-09-04T16:45:33Z",
        html_url: "https://github.com/user/repo/commit/7654321",
        sha: "7654321fedcba9876543210fedcba9876543210"
      }
    ]
  }
];

export function getCommitHistory() {
  return demoCommitHistory;
}