import type { FC, ReactNode } from "react";

export interface ModalProps {
  id?: string | undefined;
  children?: ReactNode | undefined;
  onClose: () => void | undefined;
  size?: "small" | "medium" | "large";
}

const Modal: FC<ModalProps> = ({ id, children, onClose, size = "medium" }) => {
  // Define width classes based on size prop
  const widthClasses = {
    small: "w-[342px] lg:w-[400px]",
    medium: "w-[342px] lg:w-[550px]",
    large: "w-[342px] lg:w-[800px]",
  };

  return (
    <div
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[2]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        id={id}
        className="modal relative bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 lg:p-6 ${widthClasses[size]} max-h-[90vh] overflow-auto`}>
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
