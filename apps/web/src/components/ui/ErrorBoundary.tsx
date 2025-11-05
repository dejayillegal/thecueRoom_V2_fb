"use client";

import React, { Component, ReactNode } from "react";
import { Card } from "./card";
import { Button } from "./button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-[#111111] border-[#1a1a1a] p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              variant="default"
              className="bg-[#D7FF3C] text-black hover:bg-[#c8f02f]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
