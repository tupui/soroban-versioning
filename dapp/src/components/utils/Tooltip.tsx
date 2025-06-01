/**
 * React Tooltip Component
 *
 * This is the React implementation of the Tooltip component, used for dynamic tooltips
 * that require React state management (like hover state). It's used throughout the
 * React components in the application.
 *
 * NOTE: For static tooltips in Astro components, use Tooltip.astro instead.
 * The two implementations should maintain similar styling for consistency.
 */

import { useState, type ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  text: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const Tooltip = ({ children, text, position = "top" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-sm text-white bg-black/80 
            rounded whitespace-nowrap pointer-events-none
            ${positionClasses[position]}
          `}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
