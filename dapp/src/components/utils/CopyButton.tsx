import { useState, useCallback } from "react";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  text?: string;
}

/**
 * A reusable copy button component that shows a green check mark when clicked
 */
const CopyButton = ({
  textToCopy,
  className = "",
  size = "md",
  showText = false,
  text = "Copy",
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  // Size classes mapping
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleCopy = useCallback(async () => {
    if (!textToCopy) return;

    try {
      // Use the Clipboard API
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Most modern browsers support the Clipboard API,
      // so we'll just log the error if it doesn't work
      // instead of using the deprecated execCommand
      console.error("Failed to copy text:", error);
    }
  }, [textToCopy]);

  const baseClasses =
    "hover:bg-zinc-100 transition-colors duration-200 p-1 rounded flex items-center gap-2";
  const combinedClasses = `${baseClasses} ${className}`;

  return (
    <button
      className={combinedClasses}
      onClick={handleCopy}
      aria-label={isCopied ? "Copied" : "Copy to clipboard"}
      title={isCopied ? "Copied" : "Copy to clipboard"}
    >
      {isCopied ? (
        <img
          src="/icons/check.svg"
          alt="Copied"
          className={sizeClasses[size]}
        />
      ) : (
        <img
          src="/icons/clipboard.svg"
          alt="Copy"
          className={sizeClasses[size]}
        />
      )}
      {showText && <span>{isCopied ? "Copied!" : text}</span>}
    </button>
  );
};

export default CopyButton;
