# Contributing to Inkline

Thanks for helping improve Inkline. It is a privacy-focused, local-first editor, so data safety and predictable behavior take priority over feature count.

## Before you start

- Search existing issues and pull requests before opening a duplicate.
- For substantial features or architecture changes, open an issue first so the design can be discussed.
- Keep browser/PWA behavior and Windows desktop behavior aligned unless a platform-specific difference is necessary and documented.
- Do not add analytics, telemetry, advertising, remote fonts, AI services, or document-content network calls.

## Development setup

Requirements:

- Node.js 22 or newer
- npm
- For desktop work: Rust stable, Microsoft C++ Build Tools, Windows SDK, and WebView2

```bash
npm ci
npm run dev
```

For desktop development on Windows:

```bash
npm run desktop:dev
```

See the README for complete setup and storage details.

## Quality gates

Run these before submitting a pull request:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm audit
```

Desktop changes should also pass:

```bash
npm run desktop:build -- --bundles nsis,msi
```

## Pull requests

- Keep changes focused and explain the user-visible behavior.
- Include tests for fixes and new behavior.
- Note any storage, migration, privacy, accessibility, or security impact.
- Never solve IndexedDB migrations by clearing user data.
- Do not commit generated build output, installers, test traces, local databases, or secrets.

By contributing, you agree that your contributions are licensed under the MIT License.
