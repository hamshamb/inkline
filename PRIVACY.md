# Privacy

This describes what Inkline actually does, not a marketing promise. If
something here ever stops being true of the code, that's a bug — please
open an issue.

## Where your documents live

Every document, version snapshot, and setting is stored in this browser's
**IndexedDB**, on this device. There is no server-side database and no
account — Inkline doesn't know who you are, because it never asks.

## Network activity

After the initial page load (and, once installed, after the very first
load), Inkline makes **no network requests** during normal use:

- No analytics, telemetry, or crash reporting.
- No advertising.
- No third-party fonts, scripts, or embeds loaded at runtime.
- No document content is ever sent anywhere automatically.

Exporting, copying, or printing a document is always something you
explicitly choose to do — content never leaves this device on its own.

## What could still make a request

- **Loading the app itself** — fetching the HTML/CSS/JS from wherever you're
  hosting or opening it from (or, once installed, checking for an updated
  version of the app shell). This never includes your documents.
- If a future optional integration (like sharing to a separate service) is
  ever added, it will be off by default and require explicit configuration
  — the editor will keep working fully offline without it.

## Things that *will* remove your data

- Clearing this browser's site data / storage for this origin.
- Uninstalling the browser, or resetting the device.
- Using a private/incognito window (storage is typically wiped when it
  closes).

Inkline cannot protect against any of the above — that's how browser
storage works. **Use Settings → Backup & restore to export a copy of your
library regularly**, especially before doing any of the above, switching
browsers, or moving to a new device.

## Multi-device use

Because storage is local to one browser profile on one device, documents do
not automatically appear on your other devices or browsers. Move a backup
file (Settings → Backup & restore → Export) to bring your library
somewhere else.

## Questions

If you find behavior that contradicts anything above, please file an issue
— that's a bug in the product, not a caveat in this document.
