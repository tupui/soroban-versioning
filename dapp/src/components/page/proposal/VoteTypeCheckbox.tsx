import type { FC } from "react";
import { VoteType } from "types/proposal";
import type { AnyObject, Size } from "types/types";

interface Props {
  size?: Size;
  voteType: VoteType | null;
  currentVoteType?: VoteType | null;
  onClick?: () => void;
}

const sizeMap: AnyObject = {
  sm: "24",
  md: "72",
};

const VoteTypeCheckbox: FC<Props> = ({
  size = "md",
  voteType,
  currentVoteType,
  onClick,
}) => {
  const width = `${sizeMap[size]}px`,
    height = `${sizeMap[size]}px`;
  const renderIcon = () => {
    if (voteType == currentVoteType || !currentVoteType) {
      if (voteType == VoteType.APPROVE) {
        return <img src="/icons/check-approve.svg" style={{ width, height }} />;
      }

      if (voteType == VoteType.CANCEL) {
        return <img src="/icons/check-cancel.svg" style={{ width, height }} />;
      }

      if (voteType == VoteType.REJECT) {
        return <img src="/icons/check-reject.svg" style={{ width, height }} />;
      }
    }

    return <img src="/icons/check-blank.svg" style={{ width, height }} />;
  };

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {renderIcon()}
    </div>
  );
};

export default VoteTypeCheckbox;
