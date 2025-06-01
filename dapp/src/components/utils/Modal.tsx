import type { FC, ReactNode } from "react";
import { useEffect } from "react";

export interface ModalProps {
  id?: string | undefined;
  children?: ReactNode | undefined;
  onClose: () => void | undefined;
  fullWidth?: boolean; // Optional prop to allow full width modals
}

const Modal: FC<ModalProps> = ({
  id,
  children,
  onClose,
  fullWidth = false,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    // Add event listener for ESC key
    window.addEventListener("keydown", handleEsc);

    // Prevent scrolling on body when modal is open
    document.body.style.overflow = "hidden";

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[2] p-3 sm:p-4"
      onClick={() => onClose?.()}
    >
      <div
        id={id}
        className={`modal relative bg-white shadow-modal rounded-lg max-w-[95vw] ${
          fullWidth ? "w-full max-w-6xl" : "w-full sm:w-auto"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 md:p-6 lg:p-8 max-h-[85vh] overflow-auto`}>
          {children}
        </div>
        <button
          className="absolute top-2 right-2 sm:top-0 sm:right-0 sm:lg:translate-x-1/2 sm:-translate-y-1/2 p-2 sm:p-[18px] bg-red cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close modal"
        >
          <img
            src="/icons/cancel-white.svg"
            alt="Close"
            className="w-4 h-4 sm:w-auto sm:h-auto"
          />
        </button>
      </div>
    </div>
  );
};

export default Modal;
