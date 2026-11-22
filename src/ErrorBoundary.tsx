import { Component, type ReactNode } from 'react'

/** Shows what went wrong (instead of a blank screen) and offers a way back. */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error(error)
  }
  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="screen">
        <h2>Something went wrong</h2>
        <p className="muted small">Please send this message to get it fixed:</p>
        <pre className="error-box">{`${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(0, 4).join('\n')}`}</pre>
        <button
          className="btn primary wide"
          onClick={() => {
            this.setState({ error: null })
            this.props.onReset?.()
          }}
        >
          Back
        </button>
      </div>
    )
  }
}
