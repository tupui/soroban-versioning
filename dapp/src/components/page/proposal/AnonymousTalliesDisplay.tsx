import VotingResult from "./VotingResult";
import type { VoteStatus } from "types/proposal";
import AddressDisplay from "./AddressDisplay"; // import our new component

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
  // Compute simple counts by looking at decoded votes (each row is one ballot)
  const counts = decodedVotes.reduce(
    (acc: { approve: number; reject: number; abstain: number }, v: any) => {
      if (v.vote === "approve") acc.approve += 1;
      else if (v.vote === "reject") acc.reject += 1;
      else acc.abstain += 1;
      return acc;
    },
    { approve: 0, reject: 0, abstain: 0 },
  );

  return (
    <>
      <VotingResult
        voteStatus={voteStatus}
        withDetail
        totalVotesOverride={decodedVotes.length}
        countsOverride={counts}
      />
      {decodedVotes.length > 0 && (
        <details className="border border-zinc-300 rounded max-h-48 md:max-h-60 overflow-y-auto overflow-x-auto">
          <summary className="p-2 cursor-pointer text-sm md:text-base">
            View decoded votes
          </summary>
          <div className="w-full overflow-x-auto">
            <table className="text-xs md:text-sm w-full min-w-[500px]">
              <thead>
                <tr className="bg-zinc-100 text-left">
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
                    <td className="p-1">
                      <AddressDisplay address={v.address} />
                    </td>
                    <td className="p-1">{v.vote}</td>
                    <td className="p-1">{v.weight}</td>
                    <td className="p-1">
                      {v.isProposer ? "N/A" : v.maxWeight}
                    </td>
                    <td className="p-1">{v.seed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {proofOk !== undefined && (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm md:text-base">Proof:</p>
            {proofOk === null ? null : proofOk ? (
              <span aria-label="proof-ok" className="text-green-600 text-xl">
                ✅
              </span>
            ) : (
              <span aria-label="proof-failed" className="text-red-600 text-xl">
                ❌
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-secondary max-w-prose">
            This check verifies that the aggregated tallies and seeds correspond
            to the on-chain vote commitments (weights applied during
            verification). Use it to confirm decrypted results before executing
            the proposal.
          </p>
        </div>
      )}
    </>
  );
};

export default AnonymousTalliesDisplay;
