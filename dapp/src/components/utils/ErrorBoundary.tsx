import type { ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches descendant React errors and renders fallback or retry UI. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800"
          role="alert"
        >
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="mt-2 text-sm">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            className="mt-4 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
