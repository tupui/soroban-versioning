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
  if (children?.trim()) {
    return (
      <div className={`relative ${className}`}>
        <p className="text-lg text-primary whitespace-pre-wrap">{children}</p>
      </div>
    );
  }

  return <p className="text-lg text-primary">-</p>;
}
