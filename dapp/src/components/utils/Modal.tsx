/**
 * React Modal Component
 *
 * This is the React implementation of the Modal component, used for dynamic modals
 * that require React state management and event handling. It's used throughout the
 * React components in the application.
 *
 * NOTE: For static modals in Astro components, use Modal.astro instead.
 * The two implementations should maintain similar styling for consistency.
 */

import type { FC, ReactNode } from "react";
import { useEffect, useCallback } from "react";

export interface ModalProps {
  id?: string;
  children?: ReactNode;
  onClose: () => void;
  fullWidth?: boolean;
}

const Modal: FC<ModalProps> = ({
  id,
  children,
  onClose,
  fullWidth = false,
}) => {
  // Handle ESC key to close modal
  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if the click was directly on the backdrop element
      if (e.target === e.currentTarget) {
        // First remove any event listeners to prevent double-triggering
        window.removeEventListener("keydown", handleEsc);

        // Then close the modal
        onClose();
      }
    },
    [onClose, handleEsc],
  );

  // Prevent propagation from modal content to backdrop
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    // Add event listener for ESC key
    window.addEventListener("keydown", handleEsc);

    // Prevent scrolling on body when modal is open
    document.body.style.overflow = "hidden";

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  return (
    <div
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[2] p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`modal relative bg-white shadow-modal rounded-lg max-w-[95vw] ${
          fullWidth ? "w-full max-w-6xl" : "w-full sm:w-auto"
        }`}
        onClick={handleModalClick}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-h-[85vh] overflow-auto">
          {children}
        </div>
        <button
          className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-0 md:right-0 md:translate-x-1/2 md:-translate-y-1/2 p-2 sm:p-[18px] bg-red cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close modal"
        >
          <img
            src="/icons/cancel-white.svg"
            alt="Close"
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-auto md:h-auto"
          />
        </button>
      </div>
    </div>
  );
};

export default Modal;
