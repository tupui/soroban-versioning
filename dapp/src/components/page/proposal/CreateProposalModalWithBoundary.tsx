import { ErrorBoundary } from "components/utils/ErrorBoundary";
import CreateProposalModal from "./CreateProposalModal";

export default function CreateProposalModalWithBoundary() {
  return (
    <ErrorBoundary>
      <CreateProposalModal />
    </ErrorBoundary>
  );
}
