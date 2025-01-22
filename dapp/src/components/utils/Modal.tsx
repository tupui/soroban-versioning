import { CloseIcon } from "components/icons";
import type { FC, ReactNode } from "react";

interface Props {
  id?: string;
  children?: ReactNode;
  onClose?: () => void;
}

const Modal: FC<Props> = ({ id, children, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        id={id}
        className="modal relative p-9 w-[1048px] max-h-[90vh] bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <div
          className="absolute top-0 right-0 lg:translate-x-1/2 -translate-y-1/2 p-[18px] bg-red cursor-pointer"
          onClick={onClose}
        >
          <CloseIcon />
        </div>
      </div>
    </div>
  );
};

export default Modal;
