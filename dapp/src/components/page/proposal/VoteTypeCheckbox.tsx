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
  const renderIcon = () => {
    if (voteType == currentVoteType || !currentVoteType) {
      if (voteType == VoteType.APPROVE) {
        return (
          <svg
            width={sizeMap[size]}
            height={sizeMap[size]}
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M61.7828 3.30469L31.32 40.8752L18.5187 28.2358L10.0767 37.5328L32.3089 59.4771L71.1563 11.5678L61.7828 3.30469Z"
              fill="#22A142"
            />
            <path
              d="M51.3473 68.6972H0.84375V16.7773H37.9654V20.1523H4.21875V65.3222H47.9723V57.3921H51.3473V68.6972Z"
              fill="#311255"
            />
          </svg>
        );
      }

      if (voteType == VoteType.CANCEL) {
        return (
          <svg
            width={sizeMap[size]}
            height={sizeMap[size]}
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M51.3473 68.6953H0.84375V16.7754H51.3281V20.1504V28.2649H47.9531L47.9723 20.1504H4.21875V65.3203H47.9723V57.3901H51.3473V68.6953Z"
              fill="#311255"
            />
            <path
              d="M9.98438 48.9375L9.98438 36.7031L71.1562 36.7031V48.9375L9.98438 48.9375Z"
              fill="#F2971F"
            />
          </svg>
        );
      }

      if (voteType == VoteType.REJECT) {
        return (
          <svg
            width={sizeMap[size]}
            height={sizeMap[size]}
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M51.3473 68.6953H0.84375V16.7754H9.98438V20.1504H4.21875V65.3203H47.9723V57.3901H51.3473V68.6953Z"
              fill="#311255"
            />
            <path
              d="M62.4731 1.18945L71.1564 9.87267L20.4958 60.5332L11.8126 51.85L62.4731 1.18945Z"
              fill="#F23434"
            />
            <path
              d="M20.4956 1.1875L71.1561 51.848L62.4729 60.5312L11.8124 9.87071L20.4956 1.1875Z"
              fill="#F23434"
            />
          </svg>
        );
      }
    }

    return (
      <svg
        width={sizeMap[size]}
        height={sizeMap[size]}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M51.3473 68.6953H0.84375V16.7754H51.3473V57.3901H47.9723V20.1504H4.21875V65.3203H47.9723V57.3901H51.3473V68.6953Z"
          fill="#311255"
        />
      </svg>
    );
  };

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {renderIcon()}
    </div>
  );
};

export default VoteTypeCheckbox;
