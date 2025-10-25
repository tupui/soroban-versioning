import type { FC } from "react";
import CopyButton from "components/utils/CopyButton";
import { getStellarExpertUrl } from "../../../utils/urls";
import { truncateMiddle } from "../../../utils/utils";

interface AddressDisplayProps {
  address: string;
}

/**
 * Displays a Stellar address in truncated form with copy-on-click functionality
 * and a link to Stellar Explorer.
 *
 * Example: GDJN5CL5J...NLJMQ3Y3
 */
const AddressDisplay: FC<AddressDisplayProps> = ({ address }) => {
  const explorerUrl = getStellarExpertUrl(address);

  return (
    <div className="mt-1 bg-zinc-50 p-2 rounded flex items-center gap-2 w-full">
      <div className="flex-grow text-center">
        <p className="text-sm font-mono text-primary overflow-hidden">
          {truncateMiddle(address, 16)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <CopyButton
          textToCopy={address}
          size="sm"
          className="hover:opacity-70 transition-opacity"
        />
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
          title="View on Stellar Explorer"
        >
          <img
            src="/icons/link.svg"
            alt="View on Explorer"
            width={16}
            height={16}
          />
        </a>
      </div>
    </div>
  );
};

export default AddressDisplay;
