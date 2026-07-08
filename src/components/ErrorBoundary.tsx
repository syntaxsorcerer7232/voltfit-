import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center">
          <h2 className="font-bold text-sm mb-1">Something went wrong</h2>
          <p className="text-xs opacity-80">{this.state.error?.message || 'Component failed to load.'}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-700 text-white transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-colors"
            >
              Reset App State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
