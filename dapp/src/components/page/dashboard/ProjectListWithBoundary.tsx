import { ErrorBoundary } from "components/utils/ErrorBoundary";
import ProjectList from "./ProjectList.jsx";

export default function ProjectListWithBoundary() {
  return (
    <ErrorBoundary>
      <ProjectList />
    </ErrorBoundary>
  );
}
