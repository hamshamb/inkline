# Security policy

## Supported version

Security fixes are currently applied to the latest release of Inkline.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability that could put users or their local documents at risk.

Use GitHub's private vulnerability reporting for this repository:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include affected versions, reproduction steps, impact, and any suggested mitigation.

If private vulnerability reporting is unavailable, open a minimal public issue asking the maintainer for a private contact channel without including exploit details.

## Security model

Inkline has no application backend, accounts, telemetry, advertising, or cloud synchronization. Documents are stored locally in browser IndexedDB or the Tauri WebView2 data directory. The Windows desktop shell exposes only a native save dialog and write access to the path explicitly selected by the user.

See [PRIVACY.md](./PRIVACY.md) and the README's security notes for more detail.
