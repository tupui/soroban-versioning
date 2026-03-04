import { ErrorBoundary } from "components/utils/ErrorBoundary";
import ProposalPage from "./ProposalPage";

export default function ProposalPageWithBoundary() {
  return (
    <ErrorBoundary>
      <ProposalPage />
    </ErrorBoundary>
  );
}
