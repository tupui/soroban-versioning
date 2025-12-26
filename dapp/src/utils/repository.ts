import type {
  RepositoryDescriptor,
  RepositoryProvider,
} from "../types/repository";

const DEFAULT_BRANCH: Record<RepositoryProvider, string> = {
  github: "master",
  gitlab: "master",
  forgejo: "master",
  bitbucket: "master",
  unknown: "master",
};

function detectProvider(host: string): RepositoryProvider {
  const normalized = host.toLowerCase();
  if (normalized === "github.com" || normalized.endsWith(".github.com")) {
    return "github";
  }
  if (normalized === "gitlab.com" || normalized.endsWith(".gitlab.com")) {
    return "gitlab";
  }
  if (normalized === "bitbucket.org" || normalized.endsWith(".bitbucket.org")) {
    return "bitbucket";
  }
  if (
    normalized.includes("codeberg") ||
    normalized.includes("forgejo") ||
    normalized.includes("gitea")
  ) {
    return "forgejo";
  }
  return "unknown";
}

function createRepositoryDescriptor({
  host,
  owner,
  name,
  provider,
  ref,
  url,
}: {
  host: string;
  owner: string;
  name: string;
  provider?: RepositoryProvider;
  ref?: string;
  url?: string;
}): RepositoryDescriptor {
  const normalizedHost = host.toLowerCase();
  const derivedProvider = provider ?? detectProvider(normalizedHost);
  const canonicalUrl = url ?? `https://${normalizedHost}/${owner}/${name}`;
  const descriptor: RepositoryDescriptor = {
    host: normalizedHost,
    provider: derivedProvider,
    owner,
    name,
    url: canonicalUrl,
  };

  if (ref) {
    descriptor.ref = ref;
  }

  return descriptor;
}

export function parseRepositoryUrl(
  repositoryUrl: string,
): RepositoryDescriptor | undefined {
  if (!repositoryUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(repositoryUrl);
    const segments = parsed.pathname
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean);

    if (segments.length < 2) {
      return undefined;
    }

    const [owner, name, maybeTree, maybeRef] = segments;
    if (!owner || !name) {
      return undefined;
    }
    // Support /tree/<ref> (GitHub) and /-/tree/<ref> (GitLab)
    let ref: string | undefined;
    if (maybeTree === "tree" && maybeRef) {
      ref = maybeRef;
    } else if (maybeTree === "-" && segments[3] === "tree" && segments[4]) {
      ref = segments[4];
    }
    const descriptorInit = {
      host: parsed.host,
      owner,
      name,
      url: `${parsed.origin}/${owner}/${name}`,
    };

    return ref
      ? createRepositoryDescriptor({ ...descriptorInit, ref })
      : createRepositoryDescriptor(descriptorInit);
  } catch {
    return undefined;
  }
}

export function ensureRepositoryDescriptor(
  input: RepositoryDescriptor | string | undefined,
  fallback?: {
    owner: string;
    name: string;
    host?: string;
    provider?: RepositoryProvider;
    ref?: string;
  },
): RepositoryDescriptor | undefined {
  if (!input && !fallback) {
    return undefined;
  }

  if (typeof input === "string") {
    const parsed = parseRepositoryUrl(input);
    if (parsed) {
      return parsed;
    }
    if (fallback) {
      const options: {
        host: string;
        owner: string;
        name: string;
        provider?: RepositoryProvider;
        ref?: string;
      } = {
        host: fallback.host ?? "github.com",
        owner: fallback.owner,
        name: fallback.name,
      };

      if (fallback.provider) {
        options.provider = fallback.provider;
      }
      if (fallback.ref) {
        options.ref = fallback.ref;
      }

      return createRepositoryDescriptor(options);
    }
    return undefined;
  }

  if (!input && fallback) {
    const options: {
      host: string;
      owner: string;
      name: string;
      provider?: RepositoryProvider;
      ref?: string;
    } = {
      host: fallback.host ?? "github.com",
      owner: fallback.owner,
      name: fallback.name,
    };

    if (fallback.provider) {
      options.provider = fallback.provider;
    }
    if (fallback.ref) {
      options.ref = fallback.ref;
    }

    return createRepositoryDescriptor(options);
  }

  return input as RepositoryDescriptor;
}

export function getDefaultBranch(descriptor: RepositoryDescriptor): string {
  if (descriptor.ref) {
    return descriptor.ref;
  }
  return DEFAULT_BRANCH[descriptor.provider] ?? DEFAULT_BRANCH.unknown;
}

export function getRawFileUrl(
  descriptor: RepositoryDescriptor,
  path: string,
  options: { ref?: string } = {},
): string | undefined {
  const branch = options.ref ?? getDefaultBranch(descriptor);

  switch (descriptor.provider) {
    case "github":
      return `https://raw.githubusercontent.com/${descriptor.owner}/${descriptor.name}/${branch}/${path}`;
    case "gitlab":
      return `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/-/raw/${branch}/${path}`;
    case "forgejo":
      return `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/raw/branch/${branch}/${path}`;
    case "bitbucket":
      return `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}/src/${branch}/${path}`;
    default:
      return undefined;
  }
}

/**
 * Fetch provider default branch using public APIs. Falls back to hardcoded default when unavailable.
 */
export async function fetchDefaultBranch(
  descriptor: RepositoryDescriptor,
): Promise<string> {
  try {
    // If ref is explicitly set, honor it
    if (descriptor.ref) return descriptor.ref;

    switch (descriptor.provider) {
      case "github": {
        const res = await fetch(
          `https://api.github.com/repos/${descriptor.owner}/${descriptor.name}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (data && typeof data.default_branch === "string") {
          return data.default_branch as string;
        }
        break;
      }
      case "gitlab": {
        const projectId = encodeURIComponent(
          `${descriptor.owner}/${descriptor.name}`,
        );
        const res = await fetch(
          `https://${descriptor.host}/api/v4/projects/${projectId}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (data && typeof data.default_branch === "string") {
          return data.default_branch as string;
        }
        break;
      }
      case "forgejo": {
        // Forgejo/Gitea API v1
        const res = await fetch(
          `https://${descriptor.host}/api/v1/repos/${descriptor.owner}/${descriptor.name}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (data && typeof data.default_branch === "string") {
          return data.default_branch as string;
        }
        break;
      }
      case "bitbucket": {
        const res = await fetch(
          `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (
          data &&
          data.mainbranch &&
          typeof data.mainbranch.name === "string"
        ) {
          return data.mainbranch.name as string;
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // fallthrough to hardcoded default
  }
  return DEFAULT_BRANCH[descriptor.provider] ?? DEFAULT_BRANCH.unknown;
}

/**
 * Async variant that resolves branch using fetchDefaultBranch when no ref provided.
 */
export async function getRawFileUrlAsync(
  descriptor: RepositoryDescriptor,
  path: string,
  options: { ref?: string } = {},
): Promise<string | undefined> {
  const branch = options.ref ?? (await fetchDefaultBranch(descriptor));
  switch (descriptor.provider) {
    case "github":
      return `https://raw.githubusercontent.com/${descriptor.owner}/${descriptor.name}/${branch}/${path}`;
    case "gitlab":
      return `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/-/raw/${branch}/${path}`;
    case "forgejo":
      return `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/raw/branch/${branch}/${path}`;
    case "bitbucket":
      return `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}/src/${branch}/${path}`;
    default:
      return undefined;
  }
}

export function getRepositoryReadmeUrl(
  descriptorOrUrl: RepositoryDescriptor | string,
): string | undefined {
  const descriptor = ensureRepositoryDescriptor(descriptorOrUrl);
  if (!descriptor) {
    return undefined;
  }
  return getRawFileUrl(descriptor, "README.md");
}

export async function getRepositoryReadmeUrlAsync(
  descriptorOrUrl: RepositoryDescriptor | string,
  options: { ref?: string } = {},
): Promise<string | undefined> {
  const descriptor = ensureRepositoryDescriptor(descriptorOrUrl);
  if (!descriptor) return undefined;
  return getRawFileUrlAsync(descriptor, "README.md", options);
}

export function getRepositoryConfigUrl(
  descriptorOrUrl: RepositoryDescriptor | string,
): string | undefined {
  const descriptor = ensureRepositoryDescriptor(descriptorOrUrl);
  if (!descriptor) {
    return undefined;
  }
  return getRawFileUrl(descriptor, "tansu.toml");
}

export async function getRepositoryConfigUrlAsync(
  descriptorOrUrl: RepositoryDescriptor | string,
  options: { ref?: string } = {},
): Promise<string | undefined> {
  const descriptor = ensureRepositoryDescriptor(descriptorOrUrl);
  if (!descriptor) return undefined;
  return getRawFileUrlAsync(descriptor, "tansu.toml", options);
}

export { createRepositoryDescriptor, detectProvider };
