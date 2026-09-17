import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './ToastProvider'

function TestHarness({ onMount }: { onMount: (show: ReturnType<typeof useToast>['show']) => void }) {
  const { show } = useToast()
  onMount(show)
  return null
}

describe('ToastProvider', () => {
  it('renders a toast message when show() is called', async () => {
    let show: ReturnType<typeof useToast>['show'] = () => {}
    render(
      <ToastProvider>
        <TestHarness onMount={(fn) => (show = fn)} />
      </ToastProvider>,
    )

    show('Saved successfully', 'success')
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()
  })

  it('dismisses a toast when its close button is clicked', async () => {
    const user = userEvent.setup()
    let show: ReturnType<typeof useToast>['show'] = () => {}
    render(
      <ToastProvider>
        <TestHarness onMount={(fn) => (show = fn)} />
      </ToastProvider>,
    )

    show('Dismiss me')
    const message = await screen.findByText('Dismiss me')
    const toast = message.closest('[role="status"]') as HTMLElement
    await user.click(within(toast).getByLabelText('Dismiss notification'))

    await waitFor(() => expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument())
  })

  it('runs the action callback and dismisses when the action button is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    let show: ReturnType<typeof useToast>['show'] = () => {}
    render(
      <ToastProvider>
        <TestHarness onMount={(fn) => (show = fn)} />
      </ToastProvider>,
    )

    show('Moved to Trash', 'success', { label: 'Undo', onClick })
    await user.click(await screen.findByText('Undo'))

    expect(onClick).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByText('Moved to Trash')).not.toBeInTheDocument())
  })
})
