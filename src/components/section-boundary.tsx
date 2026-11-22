import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Icon } from './icon'
import { Button } from './ui/button'

interface BoundaryProps {
  children: ReactNode
  onRetry: () => void
}

class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Section failed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }
    return (
      <div className="flex flex-col items-start gap-2 rounded-md border border-destructive-border bg-destructive-subtle p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-destructive-text">
          <Icon name="error" />
          These prices didn't load.
        </p>
        <p>That's a problem on our side, not your connection.</p>
        <Button
          variant="secondary"
          onClick={() => {
            this.setState({ failed: false })
            this.props.onRetry()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }
}

export interface SectionBoundaryProps {
  children: ReactNode
  /** id of the section H2; focus moves there after a retry */
  headingId?: string
}

/** Per-section error boundary: one failed query never takes down the page. */
export function SectionBoundary({ children, headingId }: SectionBoundaryProps) {
  const router = useRouter()
  const { reset } = useQueryErrorResetBoundary()
  return (
    <Boundary
      onRetry={() => {
        reset()
        void router.invalidate()
        if (headingId) {
          document.getElementById(headingId)?.focus()
        }
      }}
    >
      {children}
    </Boundary>
  )
}
