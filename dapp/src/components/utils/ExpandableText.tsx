import { useState } from "react";
import Button from "./Button";

interface ExpandableTextProps {
  children?: string | null;
  className?: string;
}

export function ExpandableText({
  children,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (children?.trim()) {
    return (
      <div className={`relative flex flex-col items-start gap-3 ${className}`}>
        <p
          className={`text-lg text-primary ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"} transition-all duration-300`}
        >
          {children}
        </p>
        <Button
          type="secondary"
          size="xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-1 h-1 bg-primary" />
          <div className="w-1 h-1 bg-primary" />
          <div className="w-1 h-1 bg-primary" />
        </Button>
      </div>
    );
  }

  return <p className="text-lg text-primary">-</p>;
}
