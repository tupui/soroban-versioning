// src/components/page/dashboard/OnChainActions.tsx
// Renders the list of on-chain actions grouped by day. Uses the shared
// CommitRecord component for individual rows.

import { useEffect, useState } from "react";
import {
  fetchOnChainActions,
  seedProjectNameCache,
  type OnChainAction,
} from "../../../service/OnChainActivityService";
import { formatDate } from "../../../utils/formatTimeFunctions";
import CommitRecord from "../../CommitRecord";
import {
  paramNamesForMethod,
  summaryForMethod,
} from "../../../constants/onchain";
import { badgeName } from "../../../utils/badges";

interface Props {
  /** Stellar address of the member we are displaying. */
  address: string;
  /** Cache of projectKey(hex) → projectName obtained from membership info. */
  projectCache: Record<string, string>;
}

const OnChainActions: React.FC<Props> = ({ address, projectCache }) => {
  const [actions, setActions] = useState<OnChainAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        seedProjectNameCache(projectCache);
        const data = await fetchOnChainActions(address);
        setActions(data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to load on-chain actions", err);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [address, JSON.stringify(projectCache)]);

  // Group by calendar day (ISO key YYYY-MM-DD) for stable sorting
  const grouped = actions.reduce<Record<string, OnChainAction[]>>(
    (acc, act) => {
      const isoKey = new Date(act.timestamp).toISOString().slice(0, 10);
      (acc[isoKey] ??= []).push(act);
      return acc;
    },
    {},
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (actions.length === 0) {
    return <p className="text-sm text-secondary">No on-chain activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6 pl-6 max-h-96 overflow-auto overflow-visible">
      {Object.entries(grouped)
        // Sort day groups by ISO date key descending (latest first)
        .sort(([d1], [d2]) => (d1 < d2 ? 1 : -1))
        .map(([isoDay, list]) => (
          <div key={isoDay} className="flex flex-col gap-4">
            <h3 className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#2D0F512E] rounded-full bg-transparent" />
              <span className="text-lg font-medium text-primary">
                {formatDate(`${isoDay}T00:00:00.000Z`)}
              </span>
            </h3>
            {list
              // Ensure items within a day are sorted by timestamp descending
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((a) => (
                <div key={a.txHash} className="relative">
                  <div className="absolute -left-[21px] lg:-left-[31px] w-[2px] h-full bg-[#2D0F510D]" />
                  {(() => {
                    const link = proposalLink(a);
                    const props = link
                      ? { commitLink: link }
                      : { shaLink: txExplorerUrl(a.txHash) };
                    return (
                      <CommitRecord
                        message={summaryFor(a)}
                        sha={a.txHash}
                        {...props}
                        bgClass="bg-indigo-50"
                        projectName={a.projectName ?? null}
                        showXDR={a.raw}
                        proposalLink={proposalLink(a) ?? null}
                      />
                    );
                  })()}
                </div>
              ))}
          </div>
        ))}
    </div>
  );
};

export default OnChainActions;

// -----------------------------------------------------------------------------
// Helper utilities
// -----------------------------------------------------------------------------

function txExplorerUrl(hash: string): string {
  const net = import.meta.env.SOROBAN_NETWORK || "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

function summaryFor(a: OnChainAction): string {
  const firstLine = summaryForMethod(a.method, a.details);

  const params: any[] = (a.details.params as any[]) ?? [];

  const pretty = (v: any): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v.address === "string") return v.address;
    if (typeof v.str === "string") return v.str;
    if (typeof v.sym === "string") return v.sym;
    if (typeof v.bin === "string") return `${v.bin.slice(0, 8)}…`;
    if (Array.isArray(v.vec)) {
      // Special-case badge vectors for readability
      const maybeInts = v.vec.every(
        (x: any) =>
          typeof x === "number" || x?.i32 !== undefined || x?.u32 !== undefined,
      );
      if (maybeInts) {
        return `[${v.vec.map((b: any) => badgeName(typeof b === "number" ? b : (b?.i32 ?? b?.u32 ?? 0))).join(", ")}]`;
      }
      return `[${v.vec.map(pretty).join(", ")}]`;
    }
    return JSON.stringify(v);
  };

  const paramNames = paramNamesForMethod(a.method);
  const paramLines = params.map((p, idx) => {
    const label = paramNames[idx] ?? `arg${idx}`;
    return `${label}: ${pretty(p)}`;
  });

  // Add proposal link only for vote / execute (create_proposal intentionally skipped for now)
  if (["vote", "execute"].includes(a.method)) {
    const link = proposalLink(a);
    if (link) paramLines.push(`proposal_link: ${link}`);
  }

  return paramLines.length ? [firstLine, ...paramLines].join("\n") : firstLine;
}

function proposalLink(a: OnChainAction): string | undefined {
  if (
    (a.method === "vote" || a.method === "execute") &&
    a.details.proposalId !== undefined &&
    a.details.proposalId !== null
  ) {
    const name = a.projectName ? encodeURIComponent(a.projectName) : "";
    return `/proposal?id=${a.details.proposalId}&name=${name}`;
  }
  return undefined;
}
