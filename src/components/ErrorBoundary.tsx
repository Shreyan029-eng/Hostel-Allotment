import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                System Interface Error
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {this.props.fallbackTitle || 'An Unexpected Error Occurred'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The portal encountered an unhandled rendering condition. Your session and data have not been corrupted. Please reload or navigate back to the main portal.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-left overflow-x-auto text-[11px] font-mono text-slate-700 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Portal
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
