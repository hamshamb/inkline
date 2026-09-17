import { Component, type ReactNode } from 'react'
import { product } from '../config/product'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | undefined
}

/** Catches render-time crashes so a bug never shows the user a raw stack trace or a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: undefined }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error in Inkline UI', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-6 text-center text-[var(--color-text)]">
          <p className="text-base font-semibold">Something went wrong in {product.name}.</p>
          <p className="max-w-sm text-sm text-[var(--color-muted)]">
            Your documents are safe in this browser's storage — they haven't been touched. Reloading usually fixes this.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
