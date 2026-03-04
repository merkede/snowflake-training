import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production you'd send this to an error tracking service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="rounded-xl border-2 border-red-200 p-10 text-center mx-auto max-w-lg"
          style={{ background: '#fff5f5' }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <p className="font-bold text-red-800 text-lg mb-2">Something went wrong</p>
          <p className="text-sm text-red-600 mb-6 font-mono break-words">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#ef4444' }}
          >
            Try again
          </button>
          <p className="text-xs text-red-400 mt-4">
            If this keeps happening, try clearing your browser storage.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
