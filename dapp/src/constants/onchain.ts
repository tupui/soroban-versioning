export interface MethodMeta {
  /** Param display names matching contract argument order */
  paramNames: string[];
  /** Function generating the first-line summary for a record */
  summary: (details: Record<string, unknown>) => string;
}

function shortAddr(a: string, head: number = 4, tail: number = 4): string {
  if (!a) return "";
  return a.length > head + tail ? `${a.slice(0, head)}…${a.slice(-tail)}` : a;
}

export const ONCHAIN_METHODS: Record<string, MethodMeta> = {
  register: {
    paramNames: ["maintainer", "name", "maintainers", "url", "hash"],
    summary: () => "created project",
  },
  commit: {
    paramNames: ["maintainer", "project_key", "hash"],
    summary: (d) => `committed ${((d.hash as string) ?? "").slice(0, 7)}`,
  },
  update_config: {
    paramNames: ["maintainer", "project_key", "maintainers", "url", "hash"],
    summary: () => "updated config",
  },
  add_member: {
    paramNames: ["member", "meta"],
    summary: (d) => {
      const m = (d.member as string | undefined) ?? "";
      return `added member ${shortAddr(m)}`.trim();
    },
  },
  set_badges: {
    paramNames: ["maintainer", "project_key", "member", "badges"],
    summary: (d) => {
      const m = (d.member as string | undefined) ?? "";
      return `changed badges for ${shortAddr(m)}`.trim();
    },
  },
  create_proposal: {
    paramNames: [
      "proposer",
      "project_key",
      "title",
      "ipfs",
      "voting_ends_at",
      "public_voting",
    ],
    summary: (d) =>
      d.proposalId !== undefined
        ? `created proposal #${d.proposalId}`
        : "created proposal",
  },
  vote: {
    paramNames: ["voter", "project_key", "proposal_id", "vote"],
    summary: () => "voted",
  },
  execute: {
    paramNames: [
      "maintainer",
      "project_key",
      "proposal_id",
      "tallies",
      "seeds",
    ],
    summary: () => "executed proposal",
  },
};

export const MEMBER_METHODS = Object.keys(ONCHAIN_METHODS);

export function paramNamesForMethod(method: string): string[] {
  return (
    ONCHAIN_METHODS[method as keyof typeof ONCHAIN_METHODS]?.paramNames ?? []
  );
}

export function summaryForMethod(
  method: string,
  details: Record<string, unknown>,
): string {
  const meta = ONCHAIN_METHODS[method as keyof typeof ONCHAIN_METHODS];
  return meta ? meta.summary(details) : method;
}
