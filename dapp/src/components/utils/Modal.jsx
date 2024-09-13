import React from 'react';

const Modal = ({ id, title, children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div id={id} className="modal px-3 sm:px-6 pt-3 pb-4 rounded-lg shadow-xl bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {title && <span className="bg-lime px-2 py-1 rounded-lg inline-block">{title}</span>}
          </h2>
          <button
            className="text-zinc-700 hover:text-zinc-800 hover:bg-zinc-300 rounded-md"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
