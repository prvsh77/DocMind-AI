import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppError } from "./AppError";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DocMind render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AppError
          title="This view could not load"
          message="Refresh the page or try another section."
          onAction={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
