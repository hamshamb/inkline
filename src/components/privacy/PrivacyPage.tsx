import { Dialog } from '../common/Dialog'
import { product } from '../../config/product'

export function PrivacyPage({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Privacy" widthClassName="max-w-lg">
      <div className="flex flex-col gap-3 text-sm text-[var(--color-text)]">
        <p>{product.name} is built to keep your writing on your own device.</p>
        <ul className="list-disc space-y-2 pl-5 text-[var(--color-muted)]">
          <li>Your documents are stored locally in this browser's IndexedDB — not on a server.</li>
          <li>{product.name} does not require an account and does not make network requests to send or sync your document content.</li>
          <li>There is no analytics, tracking, or advertising of any kind in this app.</li>
          <li>
            Exporting, copying, or printing a document is always something <em>you</em> choose to do — content never leaves
            this device automatically.
          </li>
          <li>
            Clearing your browser's site data (or this browser profile) will delete your documents. Use{' '}
            <strong>Settings → Backup &amp; restore</strong> to export a copy regularly.
          </li>
          <li>
            Because storage is local to this browser and device, documents do not automatically appear on your other
            devices. Use a backup file to move your library between them.
          </li>
        </ul>
      </div>
    </Dialog>
  )
}
