import { CloseIcon } from "components/icons";

const Modal = ({ id, title, children, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id={id}
        title={title}
        className="modal relative shadow-modal bg-white max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">{children}</div>
        <div
          className="absolute top-0 right-0 lg:translate-x-1/2 -translate-y-1/2 p-[18px] bg-red cursor-pointer"
          onClick={() => {
            onClose();
          }}
        >
          <CloseIcon />
        </div>
      </div>
    </div>
  );
};

export default Modal;
