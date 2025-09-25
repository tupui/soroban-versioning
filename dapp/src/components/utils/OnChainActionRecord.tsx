import { useState, useRef, useEffect } from "react";
import CommitRecord from "components/CommitRecord";
import type { ReactNode } from "react";

interface Props {
  description: ReactNode;
  date: string;
  txHash: string;
  explorerLink: string;
  raw: any;
}

/**
 * Display a single on-chain action in a style inspired by the existing
 * CommitRecord component. The raw transaction details can be toggled via a
 * collapsible section.
 */
const OnChainActionRecord = ({
  description,
  date: _date,
  txHash,
  explorerLink,
  raw: _raw,
}: Props) => {
  const [_isExpanded, _setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLAnchorElement>(null);
  const [_isOverflowing, _setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current) {
        _setIsOverflowing(
          descriptionRef.current.scrollHeight >
            descriptionRef.current.clientHeight,
        );
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [description]);

  return (
    <CommitRecord
      message={String(description)}
      sha={txHash}
      shaLink={explorerLink}
      bgClass="bg-indigo-50"
    />
  );
};

export default OnChainActionRecord;
