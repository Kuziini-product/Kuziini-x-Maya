"use client";

import React from "react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Ignore React #300 (setState during render) - it's non-fatal
    if (error.message?.includes("#300") || error.message?.includes("Cannot update")) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      // Auto-retry after a tick
      setTimeout(() => this.setState({ hasError: false }), 0);
      return null;
    }
    return this.props.children;
  }
}
