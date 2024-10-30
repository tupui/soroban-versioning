export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const ellipsis = "...";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    str.substring(0, frontChars) +
    ellipsis +
    str.substring(str.length - backChars)
  );
}

export function extractConfigData(tomlData: any, projectName: string) {
  return {
    projectName: projectName,
    logoImageLink: tomlData.DOCUMENTATION?.ORG_LOGO || "",
    thumbnailImageLink: tomlData.DOCUMENTATION?.ORG_THUMBNAIL || "",
    description: tomlData.DOCUMENTATION?.ORG_DESCRIPTION || "",
    organizationName: tomlData.DOCUMENTATION?.ORG_NAME || "",
    officials: {
      websiteLink: tomlData.DOCUMENTATION?.ORG_URL || "",
      githubLink: tomlData.DOCUMENTATION?.ORG_GITHUB || "",
    },
    socialLinks: {
      ...(tomlData.DOCUMENTATION?.ORG_TWITTER && {
        twitter: tomlData.DOCUMENTATION.ORG_TWITTER,
      }),
      ...(tomlData.DOCUMENTATION?.ORG_TELEGRAM && {
        telegram: tomlData.DOCUMENTATION.ORG_TELEGRAM,
      }),
      ...(tomlData.DOCUMENTATION?.ORG_DISCORD && {
        discord: tomlData.DOCUMENTATION.ORG_DISCORD,
      }),
    },
    authorGithubNames:
      tomlData.PRINCIPALS?.map((p: { github: string }) => p.github) || [],
    maintainersAddresses: tomlData.ACCOUNTS || [],
  };
}
