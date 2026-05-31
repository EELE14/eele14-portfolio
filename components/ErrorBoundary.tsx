/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import Bsod from "./windows/Bsod";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[ErrorBoundary] Uncaught render error:",
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <Bsod
          stopCode="PORTFOLIO_FATAL_EXCEPTION"
          detail={this.state.error.message}
        />
      );
    }
    return this.props.children;
  }
}
