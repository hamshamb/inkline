# Inkline

[![CI](https://github.com/hamshamb/inkline/actions/workflows/ci.yml/badge.svg)](https://github.com/hamshamb/inkline/actions/workflows/ci.yml)
[![Release](https://github.com/hamshamb/inkline/actions/workflows/release.yml/badge.svg)](https://github.com/hamshamb/inkline/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

*(Working name — see [Renaming](#renaming) below.)*

A local-first writing editor. Open it, start writing, and everything saves
automatically on your device. No account, no backend, no tracking. Runs as a
web app / installable PWA, and as a native Windows desktop app built with
[Tauri](https://tauri.app) — both share the exact same React/TypeScript
application.

```
Open it → Write → Autosaved locally → Close it → Come back later → It's all still there
```

|  | Web / PWA | Windows desktop |
|---|---|---|
| Install | Open the URL, optionally "Install app" from the browser | Download and run the installer — see [Installing Inkline](#installing-inkline) |
| Storage | This browser's IndexedDB | The desktop app's own local WebView data folder — **a separate store**, see [Browser vs. desktop storage](#browser-vs-desktop-storage) |
| Offline | Yes, via a service worker | Yes, always — it's a native app, there's nothing to fetch |
| Moving documents between the two | Not automatic | Export a backup in one, import it in the other |

## What it is

Inkline supports three document types:

- **Rich** — a block-based rich text editor (headings, lists, checklists, quotes, code blocks, links, text/highlight color), built on [Tiptap](https://tiptap.dev)/ProseMirror. Stored as structured JSON, not HTML.
- **Markdown** — a source editor with Source / Split / Preview modes, built on [CodeMirror 6](https://codemirror.net), with a Markdown preview rendered through a sanitizing renderer.
- **Plain text** — a distraction-free plain text editor. No formatting, no surprises.

Everything else you'd expect from an editor is here too: a document sidebar
grouped by Pinned/Today/Yesterday/Previous 7 days/Older, tags, search,
quick-open (`Ctrl/Cmd+P`), a command palette (`Ctrl/Cmd+K`), version history
with restore, archive, trash with soft-delete, import (`.txt`/`.md`, drag-drop
or file picker), export (`.txt`/`.md`/`.html`, plus print-to-PDF), full
library backup/restore, a focus mode, and light/dark themes.

## Local-first, for real

- Every document lives in **IndexedDB** (web) or the desktop app's own local
  **WebView data folder** (Windows) — always on your device, never on a
  server.
- The app makes **no network requests** for normal use — no analytics, no
  telemetry, no ads, no cloud sync. See [`PRIVACY.md`](./PRIVACY.md) (also
  available in-app under Settings → Privacy). This is true of both builds.
- The web build works **fully offline** after the first load, as an
  installable PWA. The desktop build is a native app and is offline by
  definition — there's nothing for it to fetch.
- Storage is local and **not shared between the web build and the desktop
  build, or between browsers** — see
  [Browser vs. desktop storage](#browser-vs-desktop-storage). Use
  **Settings → Backup & restore** to move your library between them, and to
  protect against clearing site data, reinstalling, or moving to a new
  machine.

## Installing Inkline

### Web / PWA

Open the app's URL in a browser. To use it offline or give it its own
window, most browsers offer an "Install app" (or "Install Inkline…") option
in the address bar or menu — this installs it as a PWA, backed by the same
IndexedDB storage as the browser tab.

### Windows desktop

1. Go to the [Releases](#releases) page and download the latest
   `Inkline_<version>_windows_x64_setup.exe` (NSIS installer, recommended)
   or `Inkline_<version>_windows_x64.msi`.
2. Run it. **These installers are not code-signed** (see
   [Releases](#releases) for why and how to verify your download instead),
   so Windows SmartScreen will very likely show an "unrecognized app"
   warning — choose **More info → Run anyway** if you're satisfied the
   download is genuine.
3. Launch Inkline from the Start menu like any other app.

The NSIS installer installs per-user (no admin rights required) to
`%LOCALAPPDATA%\Inkline\`. Uninstalling (Settings → Apps, or the Start menu
entry) removes the app but **deliberately leaves your documents in place**
— see [Browser vs. desktop storage](#browser-vs-desktop-storage) — so
reinstalling later picks up right where you left off. Back up first anyway
if you want a portable copy.

There's no separate download for the checksums file — it ships alongside
the installers in the same release.

## Supported document types (and their limits)

| Type | Canonical storage | Notes |
|---|---|---|
| Rich | Tiptap/ProseMirror JSON | Never stored/exported as raw HTML. HTML export is generated fresh from the JSON through Tiptap's own schema-based serializer. |
| Markdown | Plain string | Preview rendering disables raw HTML in the Markdown source and re-validates every link/image destination — see [Security](#security-notes). |
| Plain text | Plain string | No formatting, no Markdown auto-conversion. |

A document's type is fixed at creation and never silently converted. There
is no built-in "convert to another type" action in v1 — see
[Limitations](#known-limitations-v1).

## Browser vs. desktop storage

**The web build and the Windows desktop build do not share storage.**
Documents you write in one do not automatically appear in the other. This
isn't a missing feature to route around — it's how the two are actually
built, and claiming otherwise would be misleading:

- The **web build** stores documents in **IndexedDB**, scoped by the
  browser to Inkline's origin (the URL/domain you loaded it from). Every
  browser, browser profile, and device has its own separate copy.
- The **Windows desktop build** is a [Tauri](https://tauri.app) app: the UI
  runs inside a Microsoft Edge **WebView2** instance that Tauri gives its
  own private browsing data folder — completely separate from any actual
  Edge or Chrome you have installed, and separate from any browser tab
  running the web build. This is empirically verified, not a guess: with
  the app's identifier set to `com.inkline.desktop`, WebView2's data lands
  at `%LOCALAPPDATA%\com.inkline.desktop\EBWebView\Default\`, and Inkline's
  documents specifically end up in that folder's
  `IndexedDB\http_tauri.localhost_0.indexeddb.leveldb\` — the same on-disk
  *technology* as the browser build (IndexedDB, as LevelDB files), just a
  different, unrelated database instance at a different path. (Tauri
  derives the `%LOCALAPPDATA%\<...>` root from the `identifier` field in
  `src-tauri/tauri.conf.json`, so it changes if that ever does — see
  [Renaming](#renaming).)

**The supported way to move documents between them is
Settings → Backup & restore**: export a full-library backup file from one,
import it into the other (merge or replace). This is the same
mechanism you'd already use to move Inkline between two browsers or two
machines — desktop is just another destination for it. See
[`PRIVACY.md`](./PRIVACY.md) for the broader local-storage/data-safety
model this follows.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. No environment variables or backend setup
are required — there is no backend.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally (used by the E2E tests) |
| `npm run lint` | Run `oxlint` |
| `npm run typecheck` | Run the TypeScript compiler with no emit |
| `npm test` | Run the Vitest unit/component test suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright end-to-end suite against a production build (starts `npm run preview` automatically) |
| `npm run test:e2e:ui` | Same, with Playwright's UI runner |
| `npm run desktop:dev` | Run the Windows desktop app in dev mode (Tauri + the Vite dev server) — see [Desktop development](#desktop-development) |
| `npm run desktop:build` | Build the Windows desktop installers (NSIS + MSI) |

## Desktop development

The desktop app is the same `src/` frontend as the web build, shown inside a
native window by [Tauri](https://tauri.app) — nothing under `src/` is
Windows-specific, and `npm run dev` / `npm run build` for the web app are
completely unaffected by any of this. The Tauri-specific pieces live in
`src-tauri/` (Rust) and are limited to: the app window/bundle configuration,
and a small native "Save As" adapter for exports (see
[Export/print on desktop](#exportprint-on-desktop)).

### Prerequisites (one-time, Windows)

1. **Rust** — install via [rustup](https://rustup.rs/) (`stable-msvc` toolchain).
2. **Microsoft C++ Build Tools** — install the
   ["Desktop development with C++" workload](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   (this is what actually links the Windows binary; Rust alone isn't enough
   on Windows).
3. **WebView2 Runtime** — already installed on any up-to-date Windows 10/11
   machine (it ships with Edge). [Manual download](https://developer.microsoft.com/microsoft-edge/webview2/)
   if needed.

Verify with:

```bash
rustc --version
cargo --version
```

### Running and building

```bash
npm run desktop:dev     # opens a native window, hot-reloads like the web dev server
npm run desktop:build   # produces installers under src-tauri/target/release/bundle/
```

`desktop:build` produces:

- `src-tauri/target/release/bundle/nsis/*.exe` — NSIS installer (preferred)
- `src-tauri/target/release/bundle/msi/*.msi` — MSI installer

Both are unsigned in a local build, same as the ones attached to
[Releases](#releases).

### Desktop-specific configuration

- **`src-tauri/tauri.conf.json`** — product name, window size, bundle
  targets (`nsis`, `msi` only — no other platform's bundles are built), and
  the app's Content-Security-Policy. The app **version** is read from this
  repo's `package.json` (`"version": "../package.json"`), so bumping the
  version in one place is enough for both builds.
- **`src-tauri/capabilities/default.json`** — the exact, narrow set of
  native permissions the window has: core window APIs, a save-file dialog,
  and permission to *write* (never read) to whatever path the user picks
  through that dialog. No filesystem read access, no shell/process
  execution, no network capability is granted. See
  [Security notes](#security-notes).
- **`src-tauri/icons/`** — generated from the same brand icon as the PWA
  (`npx tauri icon <path-to-a-1024×1024-png>` regenerates the full set after
  a rebrand).

### Export/print on desktop

Exporting a document (`.txt`/`.md`/`.html`) and downloading a backup use a
small adapter (`src/export/download.ts`) instead of one hardcoded
implementation:

- **Web**: an `<a download>` Blob trigger, as before — unchanged.
- **Desktop**: Tauri's native "Save As" dialog, then writing exactly the
  path the user chose (`src/export/downloadTauri.ts`). Cancelling that
  dialog is treated as "nothing happened" — a backup-replace's mandatory
  safety-backup step, for example, aborts the replace rather than
  proceeding without one.

Both paths are covered by unit tests (`src/export/download.test.ts`).
Printing (`window.print()`) needs no adapter — WebView2 supports it the
same way a browser does, so `Print / Save as PDF` works unchanged on
desktop.

## Architecture

```
React UI (components/, app/)
    │
Editor layer (editors/rich, editors/markdown, editors/plaintext)
    │
Application services (services/, documents/, search/, backup/, import/, export/, settings/)
    │
Dexie (db/schema.ts)
    │
IndexedDB (source of truth)
```

Key boundaries, and why they're drawn where they are:

- **`src/db/`** — the Dexie database class and its versioned schema. This is
  the only place that knows about IndexedDB table names/indexes. Nothing
  else touches `indexedDB` directly.
- **`src/services/`** — `documentService`, `versionService`,
  `autosaveService`: the only code allowed to write to the `documents` and
  `versions` tables. UI components call these, never Dexie directly.
- **`src/documents/`** — pure functions and Zod schemas for validating and
  transforming document content (title derivation, plain-text extraction,
  the closed rich-content schema). No I/O.
- **`src/editors/`** — one folder per document type, each owning its editor
  library integration (Tiptap extensions/toolbar/slash-menu for Rich,
  CodeMirror setup/theme for Markdown and Plain text) plus a shared
  `EditorHost` that wires whichever editor is active to autosave.
- **`src/search/`, `src/backup/`, `src/import/`, `src/export/`** — each a
  self-contained feature service with its own validation boundary.
- **`src/settings/`** — the Zod-validated settings schema, the service that
  persists it, and the React context that exposes it.
- **`src/command/`** — a single command registry (`registry.ts`) that both
  the command palette and the global keyboard-shortcut handler read from,
  so a shortcut and its palette entry can never drift apart.
- **`src/config/product.ts`** — the one file that owns the product name/
  branding, so a rename later doesn't require hunting through the codebase
  (`vite.config.ts` also reads it, to keep `index.html`'s `<title>` and the
  PWA manifest in sync).
- **`src-tauri/`** — the Windows desktop shell. It has no knowledge of
  documents, editors, or storage internals; it only (a) hosts the exact
  same `dist/` build the web app ships, and (b) exposes one narrow native
  capability (a save-file dialog) that `src/export/downloadTauri.ts` calls
  through `@tauri-apps/plugin-dialog`/`plugin-fs`. See
  [Desktop development](#desktop-development).

### Data model

```ts
DocumentRecord {
  id, title, type: 'rich' | 'markdown' | 'plaintext',
  content,            // Tiptap JSON for rich, string otherwise
  createdAt, updatedAt, lastOpenedAt,
  pinned, archived, deletedAt,
  tags: string[],
  titleIsManual,      // true once the user renames it themselves
}

VersionRecord {
  id, documentId, content, createdAt,
  reason: 'auto' | 'session-start' | 'before-restore' | 'before-import' | 'before-backup-restore' | 'manual',
  wordCount,
}
```

Every record is validated against a Zod schema at the persistence boundary
(`documents/validation.ts`) — including a **closed** schema for rich content
(`documents/richSchema.ts`) that only accepts the exact node/mark types the
Rich editor's Tiptap extensions produce. Anything else (an unknown node
type, an unsafe link scheme, a plain HTML string) is rejected before it's
ever written to IndexedDB.

### Autosave

```
editor change → debounce ~500ms → validate → IndexedDB write → status: Saving/Saved/Error
```

`Ctrl/Cmd+S` flushes immediately. Switching documents or navigating away
flushes any pending save first. A version snapshot is taken periodically
(at most once per 5 minutes per document, only when content actually
changed) rather than on every keystroke, plus always before a restore and
before a destructive backup replace — see `services/versionService.ts` for
the exact policy and its pruning (bounded at 100 snapshots/document).

### PWA / offline

`vite-plugin-pwa` precaches the built app shell only — documents always live
in IndexedDB, never in the service worker cache, so a stale cached bundle
can never shadow newer data. Updates use `registerType: 'prompt'`: a new
version installs in the background and a small "Reload to update" banner
appears; the app never force-reloads out from under someone mid-sentence.

## Security notes

- Rich content is stored as **validated structured JSON**, never as raw
  HTML — see `documents/richSchema.ts`. HTML is only ever *generated*
  (never stored) for export, via Tiptap's own JSON→HTML serializer against
  that same closed schema.
- Markdown preview rendering (`editors/markdown/render.ts`) disables raw
  HTML in the Markdown source entirely, re-validates every link/autolink
  destination against a scheme allowlist (`http:`, `https:`, `mailto:`,
  `tel:`), and never renders `![]()` image syntax as an `<img>` tag (v1 has
  no image support, and loading a remote image would be an undisclosed
  network request) — it renders as a text placeholder instead.
- Every `dangerouslySetInnerHTML` in the codebase is fed exclusively by
  either of the two paths above — never by a raw/untrusted string.
- Backup restore validates the entire file against a Zod schema *before*
  writing anything, inside a single transaction; an invalid file changes
  nothing.
- **Desktop only**: the app window has a strict Content-Security-Policy
  (`src-tauri/tauri.conf.json`, no `null`/wildcard CSP) and its native
  capability grant (`src-tauri/capabilities/default.json`) is limited to
  core window APIs plus write-only access to a path the user explicitly
  picks via a save dialog — no filesystem read access, no shell/process
  execution, and no network capability are granted to the window. Nothing
  in the desktop build widens the app's permissions to make an API more
  convenient; see [Desktop development](#desktop-development).
- See [`PRIVACY.md`](./PRIVACY.md) for the data-handling side of this.

## Releases

Windows desktop builds are published on the
[Releases](../../releases) page, built by
[`.github/workflows/release.yml`](./.github/workflows/release.yml)
whenever a `v*.*.*` tag (e.g. `v1.0.0`) is pushed. That workflow:

1. Installs dependencies with `npm ci` and runs lint, typecheck, unit tests,
   and the production web build — the same gates as local development.
2. Builds the Windows NSIS and MSI installers with Tauri on a
   `windows-latest` GitHub-hosted runner (which already has the MSVC Build
   Tools and WebView2 runtime Tauri needs).
3. Renames the artifacts to `Inkline_<version>_windows_x64_setup.exe` and
   `Inkline_<version>_windows_x64.msi`, and generates `SHA256SUMS.txt`.
4. Creates (or updates) the GitHub Release for that tag and attaches all
   three files. GitHub's automatic "Source code (zip/tar.gz)" archives are
   left as-is — no redundant source archive is added.

### Signing status

**These installers are not code-signed.** Signing requires a paid code
signing certificate, which this project does not currently have. Unsigned
means Windows SmartScreen will likely warn on first run, and there is no
publisher-identity guarantee from Windows itself — verify the download
against the published `SHA256SUMS.txt` instead:

```powershell
certutil -hashfile Inkline_<version>_windows_x64_setup.exe SHA256
```

and compare the result to the matching line in `SHA256SUMS.txt`.

The release workflow is structured so signing can be added later without
restructuring it — see the comment block at the bottom of
[`release.yml`](./.github/workflows/release.yml). It would need a code
signing certificate added as GitHub repository secrets; **no such secrets
exist in this repository today, and none are read by the current
workflow**.

## Testing

- **Unit/component** (Vitest + Testing Library): document validation, CRUD,
  autosave debouncing/flush/error handling, rich JSON serialization and
  plain-text extraction, Markdown safe-rendering, search, word counts,
  version creation/pruning/restore, import, backup creation/validation/
  restore, Dexie schema migrations, settings validation, safe-link
  validation, title-derivation behavior, and a few interactive components.
  Runs against `fake-indexeddb`, so no browser is needed.
- **End-to-end** (Playwright, against a real production build): creating
  and editing each document type and confirming content survives a reload;
  rename/duplicate/pin/archive/trash/restore; search, quick-open, command
  palette; version history and restore; export, import, backup and backup
  restore (including rejecting an invalid backup); light/dark theme;
  keyboard shortcuts; a mobile-width viewport; and a full offline flow
  (load once online, cut the network, reload, keep writing, switch
  documents, reload again).

```bash
npm test           # unit tests
npm run test:e2e   # end-to-end tests (builds + previews automatically)
```

## Known limitations (v1)

- No document type conversion (Rich ⇄ Markdown ⇄ Plain text) — types are
  fixed at creation.
- No images. Markdown image syntax renders as a text placeholder rather
  than loading anything.
- Rich → Markdown export is one-way and best-effort: underline, text color,
  and highlight have no standard Markdown equivalent and export as plain
  text.
- No accounts, cloud sync, or multi-device sync — a backup file is the way
  to move your library between browsers/devices, and between the web and
  desktop builds (they use separate local storage — see
  [Browser vs. desktop storage](#browser-vs-desktop-storage)).
- No AI features of any kind, by design.
- Desktop builds are Windows x64 only for now, and are unsigned — see
  [Releases](#releases).

## Renaming

"Inkline" is a working name. All product-facing strings pull from
[`src/config/product.ts`](./src/config/product.ts) (name, short name,
description, storage namespace, backup format id) and `vite.config.ts`
injects the name/description into `index.html` at build time — so renaming
the product is primarily a one-file edit. The one thing that requires an
explicit migration plan is `storageNamespace` (used in the IndexedDB
database name): changing it without one would make existing users'
documents appear to disappear (they'd still be on disk under the old
database name).

The desktop build has two more places that need a matching update, since
Cargo/Tauri don't read `product.ts`: `productName` in
`src-tauri/tauri.conf.json`, and — treat this one like `storageNamespace`
above — the app `identifier` in the same file, which determines the
desktop app's data folder (see
[Browser vs. desktop storage](#browser-vs-desktop-storage)). Changing the
identifier after shipping a release is effectively "move everyone to a new,
empty install."

## Roadmap

Not committed to, but the architecture leaves room for:

- Explicit "Duplicate & Convert as…" between document types (never silent
  in-place conversion).
- A defined sync/multi-device story, if one is added — it would need its
  own design pass, not a bolt-on.
- Sharing a document to an external service (e.g. TinyPaste, a separate
  product): [`src/integrations/shareAdapter.ts`](./src/integrations/shareAdapter.ts)
  already defines the adapter interface and a registration point, and the
  Export dialog shows a "Share via …" action only once an adapter is
  registered. No adapter ships by default, and this repo intentionally
  contains no calls to any specific external API — the editor is fully
  functional with zero integrations configured.
- Code-signed Windows installers (needs a purchased certificate — see
  [Releases](#releases)).
- macOS/Linux desktop targets, using the same `src-tauri/` setup.
- An auto-update flow for the desktop app (Tauri's updater plugin), if
  signing is added — unsigned auto-updates aren't a good idea.

Deliberately **not** planned: accounts, real-time collaboration, AI
features, image embedding, or ads/analytics of any kind — see
[`PRIVACY.md`](./PRIVACY.md) and the "No AI" / "No accounts" stance this
project is built around.

## License

MIT — see [`LICENSE`](./LICENSE).
