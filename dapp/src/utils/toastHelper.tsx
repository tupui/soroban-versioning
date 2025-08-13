import React from "react";
import { createRoot } from "react-dom/client";
import Button from "../components/utils/Button";
import Modal from "../components/utils/Modal";

interface ToastModalProps {
  imgSrc: string;
  title: string;
  description: string;
  onClose: () => void;
}

/**
 * Toast Modal Component
 *
 * A specialized modal component for toast notifications.
 */
const ToastModal: React.FC<ToastModalProps> = ({
  imgSrc,
  title,
  description,
  onClose,
}) => {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-4 sm:gap-[18px]">
        <img
          src={imgSrc}
          alt="Toast icon"
          className="w-16 h-16 sm:w-auto sm:h-auto"
        />
        <div className="flex-grow flex flex-col gap-4 sm:gap-[30px]">
          <div className="flex flex-col gap-2 sm:gap-3">
            <p className="leading-6 text-xl sm:text-2xl font-medium text-primary">
              {title}
            </p>
            {description && (
              <p className="text-sm sm:text-base text-secondary">
                {description}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 sm:gap-[18px]">
            <Button onClick={onClose} className="w-full sm:w-auto">
              OK
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Renders a toast modal with the given parameters
 *
 * This function creates a container, renders a React modal into it,
 * and handles cleanup when the modal is closed.
 */
export const renderToastModal = (
  imgSrc: string,
  title: string,
  description: string,
  shouldRefreshOnClose: boolean = false,
) => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    // For success toasts, close all other modals and refresh the page
    if (shouldRefreshOnClose) {
      // Close all other modals by removing modal containers
      const modalContainers = document.querySelectorAll(
        "[data-modal-container]",
      );
      modalContainers.forEach((modal) => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      });

      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  root.render(
    <ToastModal
      imgSrc={imgSrc}
      title={title}
      description={description}
      onClose={handleClose}
    />,
  );
};
