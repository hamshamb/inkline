/**
 * Optional external "share" integration boundary (e.g. a future "Share via
 * TinyPaste" action). Inkline has zero knowledge of any specific external
 * service's API here — this only defines the shape an adapter must
 * implement and a place to register one.
 *
 * No adapter is registered by default, and none should be added to this
 * repository speculatively. A real adapter (implementing this interface)
 * would live in its own module and be wired in via `registerShareAdapter`
 * only once that service's actual API is known — until then, every
 * share-related UI stays hidden via `getShareAdapter() === undefined`.
 */
export interface ShareContent {
  title: string
  format: 'text' | 'markdown' | 'html'
  content: string
}

export interface ShareResult {
  /** A URL the user can open or copy to view the shared content. */
  url: string
}

export interface ShareAdapter {
  /** Display name shown in the UI, e.g. "TinyPaste". */
  name: string
  share(content: ShareContent): Promise<ShareResult>
}

let activeAdapter: ShareAdapter | undefined

export function registerShareAdapter(adapter: ShareAdapter | undefined): void {
  activeAdapter = adapter
}

export function getShareAdapter(): ShareAdapter | undefined {
  return activeAdapter
}
