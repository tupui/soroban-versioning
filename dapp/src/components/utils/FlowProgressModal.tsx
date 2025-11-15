import Modal from "./Modal";
import ProgressStep from "./ProgressStep";
import Button from "./Button";

export interface FlowProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  step: number;
  setStep: (step: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  isSuccessful: boolean;
  setIsSuccessful: (success: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  signLabel?: string;
  successTitle?: string;
  successMessage?: string;
  children?: React.ReactNode;
}

const FlowProgressModal: React.FC<FlowProgressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  step,
  setStep,
  setIsLoading,
  setIsUploading,
  isSuccessful,
  setIsSuccessful,
  error,
  setError,
  signLabel = "action",
  successTitle = "Success!",
  successMessage = "Your action has been completed successfully.",
  children,
}) => {
  const handleClose = () => {
    // Reset all states when closing
    setIsSuccessful(false);
    setStep(0);
    setIsLoading(false);
    setIsUploading(false);
    setError(null);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={handleClose}>
      {step >= 6 && step <= 9 ? (
        <ProgressStep step={step - 5} signLabel={signLabel} />
      ) : isSuccessful ? (
        <div
          className="flex flex-col sm:flex-row items-center gap-6 sm:gap-[18px] p-4 sm:p-6"
          data-testid="flow-success"
        >
          <img
            src="/images/flower.svg"
            alt="Success"
            className="w-40 h-40 sm:w-auto sm:h-auto"
          />
          <div className="flex-grow flex flex-col gap-5 text-center sm:text-left">
            <p className="text-lg sm:text-xl font-bold text-primary">
              {successTitle}
            </p>
            <p className="text-sm sm:text-base text-secondary">
              {successMessage}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-[18px]">
              <Button type="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleSuccess}>Continue</Button>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          className="flex flex-col sm:flex-row items-center gap-6 sm:gap-[18px] p-4 sm:p-6"
          data-testid="flow-error"
        >
          <img
            src="/images/wrong.svg"
            alt="Error"
            className="w-40 h-40 sm:w-auto sm:h-auto"
          />
          <div className="flex-grow flex flex-col gap-5 text-center sm:text-left">
            <p className="text-lg sm:text-xl font-bold text-red-600">
              Something went wrong
            </p>
            <p className="text-sm sm:text-base text-secondary">{error}</p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-[18px]">
              <Button type="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setError(null)}>Try Again</Button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </Modal>
  );
};

export default FlowProgressModal;
