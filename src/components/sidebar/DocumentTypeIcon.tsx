import { FileText, FileCode, File, type LucideIcon } from 'lucide-react'
import type { DocumentType } from '../../types/document'

const ICONS: Record<DocumentType, LucideIcon> = {
  rich: FileText,
  markdown: FileCode,
  plaintext: File,
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rich: 'Rich',
  markdown: 'Markdown',
  plaintext: 'Plain text',
}

export function DocumentTypeIcon({ type, size = 14, className }: { type: DocumentType; size?: number; className?: string }) {
  const Icon = ICONS[type]
  return <Icon size={size} className={className} aria-hidden />
}
