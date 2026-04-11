"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="th-card border border-red-400/20 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="th-text font-bold text-sm mb-1">
            Eroare in sectiunea {this.props.section || "aceasta"}
          </p>
          <p className="th-text-muted text-xs mb-4">
            {this.state.error?.message || "A aparut o eroare neasteptata."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 bg-[#C9AB81] text-[#0A0A0A] px-4 py-2 font-bold text-xs tracking-wider uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reincearca
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
