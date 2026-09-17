import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete forever?"
        message="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('Delete forever?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('does not mark the native dialog as open when closed', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Hidden" message="msg" onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(container.querySelector('dialog')).not.toHaveAttribute('open')
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open title="Confirm?" message="msg" confirmLabel="Yes, do it" onConfirm={onConfirm} onCancel={() => {}} />,
    )
    await user.click(screen.getByText('Yes, do it'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Confirm?" message="msg" onConfirm={() => {}} onCancel={onCancel} />)
    await user.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the dialog close button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Confirm?" message="msg" onConfirm={() => {}} onCancel={onCancel} />)
    await user.click(screen.getByLabelText('Close dialog'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
