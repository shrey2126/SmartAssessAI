import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-8">
          <div className="max-w-md glass rounded-2xl p-8">
            <h1 className="font-display text-2xl mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-500 mb-4">{this.state.error.message}</p>
            <button className="rounded-full px-4 py-2 bg-ink-950 text-white dark:bg-white dark:text-ink-950" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
