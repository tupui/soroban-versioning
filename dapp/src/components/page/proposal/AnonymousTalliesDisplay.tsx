import VotingResult from "./VotingResult";
import React from "react";
import type { VoteStatus } from "types/proposal";

interface Props {
  voteStatus: VoteStatus | undefined;
  decodedVotes: any[];
  proofOk?: boolean | null;
}

const AnonymousTalliesDisplay: React.FC<Props> = ({
  voteStatus,
  decodedVotes,
  proofOk,
}) => {
  return (
    <>
      <VotingResult
        voteStatus={voteStatus}
        withDetail
        totalVotesOverride={decodedVotes.length}
      />
      {decodedVotes.length > 0 && (
        <details className="border border-zinc-300 rounded max-h-48 overflow-y-auto">
          <summary className="p-2 cursor-pointer">View decoded votes</summary>
          <table className="text-sm w-full">
            <thead>
              <tr className="bg-zinc-100">
                <th className="p-2">Address</th>
                <th>Vote</th>
                <th>Weight</th>
                <th>Max</th>
                <th>Seed</th>
              </tr>
            </thead>
            <tbody>
              {decodedVotes.map((v, i) => (
                <tr key={i} className="odd:bg-white even:bg-zinc-50">
                  <td className="p-1 break-all">{v.address}</td>
                  <td className="p-1">{v.vote}</td>
                  <td className="p-1">{v.weight}</td>
                  <td className="p-1">{v.maxWeight}</td>
                  <td className="p-1">{v.seed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {proofOk !== undefined && (
        <div className="flex items-center gap-2 mt-4">
          <p className="text-base">Proof validation:</p>
          {proofOk === null ? null : proofOk ? (
            <span className="text-green-600 font-semibold">valid ✅</span>
          ) : (
            <span className="text-red-600 font-semibold">failed ❌</span>
          )}
        </div>
      )}
    </>
  );
};

export default AnonymousTalliesDisplay;
