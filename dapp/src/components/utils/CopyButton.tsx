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
      // Try the modern Clipboard API first
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy using Clipboard API:", error);

      // Fallback method for browsers that don't support clipboard API
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);

        // Select and copy the text
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");

        // Clean up
        document.body.removeChild(textArea);

        if (successful) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
      } catch (fallbackError) {
        console.error("Fallback copy method failed:", fallbackError);
      }
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
