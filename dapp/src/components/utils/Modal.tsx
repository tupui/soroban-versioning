import type { FC, ReactNode } from "react";
import { useEffect } from "react";

export interface ModalProps {
  id?: string | undefined;
  children?: ReactNode | undefined;
  onClose: () => void | undefined;
}

const Modal: FC<ModalProps> = ({ id, children, onClose }) => {
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
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[2]"
      onClick={() => onClose?.()}
    >
      <div
        id={id}
        className="modal relative bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 lg:p-9 w-[342px] lg:w-[1048px] max-h-[90vh] overflow-auto">
          {children}
        </div>
        <div
          className="absolute top-0 right-0 lg:translate-x-1/2 -translate-y-1/2 p-[18px] bg-red cursor-pointer"
          onClick={onClose}
        >
          <img src="/icons/cancel-white.svg" />
        </div>
      </div>
    </div>
  );
};

export default Modal;
