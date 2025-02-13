import type { FC, ReactNode } from "react";

export interface ModalProps {
  id?: string | undefined;
  children?: ReactNode | undefined;
  onClose: () => void | undefined;
}

const Modal: FC<ModalProps> = ({ id, children, onClose }) => {
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
        <div className="p-9 w-[1048px] max-h-[90vh] overflow-auto">
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
