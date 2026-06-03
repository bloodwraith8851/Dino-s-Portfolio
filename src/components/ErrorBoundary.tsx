import React from 'react';
import { captureError } from '../lib/errorReporting';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI to render when an error is caught */
  fallback?: React.ReactNode;
  /** Optional callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary that catches render errors in its subtree.
 * Displays a dark-themed fallback UI and reports errors via the errorReporting module.
 * In development mode, shows the error message and stack trace for debugging.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      componentStack: errorInfo.componentStack ?? undefined,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback takes priority
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = true; // Temporary debug for production crash

    return (
      <div
        style={{
          background: '#0c0c0c',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          padding: '2rem',
          margin: '1rem 0',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          color: '#e0e0e0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }} role="img" aria-label="Error">
            ⚠️
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ff6b6b',
              letterSpacing: '0.05em',
            }}
          >
            Something went wrong
          </h3>
        </div>

        {isDev && this.state.error && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#ff9999', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>{this.state.error.message}</p>
            {this.state.error.stack && (
              <pre
                style={{
                  background: '#111',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: '#999',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.stack}
              </pre>
            )}
          </div>
        )}

        <button
          onClick={this.handleReset}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#e0e0e0',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            transition: 'border-color 0.2s',
          }}
          onMouseOver={(e) => ((e.target as HTMLButtonElement).style.borderColor = '#888')}
          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.borderColor = '#444')}
        >
          Try Again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
