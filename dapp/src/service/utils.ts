export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions);
    return `Today, ${formattedTime}`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, dateOptions);
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, dateOptions);
}

export function getGithubContentUrl(username: string, repoName: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${username}/${repoName}/${filePath}`;
}

export function getGithubContentLink(username: string, repoName: string, filePath: string): string {
  return `https://github.com/${username}/${repoName}/blob/${filePath}`;
}

export function getAuthorRepo(repoUrl: string): { username: string | undefined; repoName: string | undefined } {
  const match = repoUrl.match(/https\:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match || !match[1] || !match[2]) return {username: undefined, repoName: undefined};
  return { username: match[1], repoName: match[2] };
}

export function getGithubContentUrlFromConfigUrl(configUrl: string): string | undefined {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (username && repoName) {
    return getGithubContentUrl(username, repoName, 'main/tansu.toml');
  }
  return undefined;
}

export function getGithubContentLinkFromConfigUrl(configUrl: string, filePath: string): string {
  return `${configUrl}/blob/${filePath}`;
}

