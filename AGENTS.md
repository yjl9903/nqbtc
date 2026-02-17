# Repository Guidelines

## Reference about qBittorrent

- [WebUI-API-(qBittorrent-5.0)](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0))
- [WebUI-API-(qBittorrent-4.1)](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1))

## Project Structure & Module Organization

This repository is a `pnpm` + Turborepo monorepo.

- `packages/core`: core qBittorrent WebUI TypeScript API client.
- `packages/node`: Node-focused package exports (WIP).
- `packages/nqbt`: published library package.
- `packages/nqbtc`: CLI package (`nqbtc` binary, MCP command).

Each package follows the same layout:

- `src/`: implementation.
- `test/`: Vitest tests (`*.test.ts`).
- `dist/`: build output (generated; do not edit manually).

## Build, Test, and Development Commands

Run commands from repository root unless noted.

- `pnpm install`: install workspace dependencies.
- `pnpm build`: run `turbo run build` for all packages.
- `pnpm dev`: run all package `dev` tasks in parallel (no cache).
- `pnpm typecheck`: TypeScript checks across the workspace.
- `pnpm test:ci`: CI-style test run (`vitest --run` in each package).
- `pnpm format`: format TS sources/tests via Prettier.

Useful package-scoped example:

- `pnpm -F @nqbt/core test`

## Coding Style & Naming Conventions

- Language: TypeScript with ESM (`"type": "module"`).
- Formatting (Prettier): `singleQuote: true`, `semi: true`, `printWidth: 100`, `trailingComma: none`.
- Indentation: 2 spaces.
- Naming:
  - `PascalCase` for classes/types.
  - `camelCase` for functions/variables.
  - test files use `*.test.ts`.

## Testing Guidelines

- Framework: Vitest.
- Location: package-local `test/` directories.
- Naming: keep tests adjacent in `test/` and use descriptive `describe/it` labels.
- Run locally with `pnpm test` (per package) or `pnpm test:ci` (workspace, non-watch).
- No explicit coverage threshold is enforced currently; add tests for all behavior changes.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style seen in history, e.g.:
  - `feat(core): add API method`
  - `chore: update dependencies`
- Prefer scoped commits when touching a single package (`core`, `node`, `nqbt`, `nqbtc`).
- PRs should include:
  - clear summary of behavior changes,
  - linked issue (if applicable),
  - test evidence (commands run and results),
  - CLI output snippets or screenshots when changing user-facing behavior.
- Ensure CI passes (`pnpm build` and `pnpm test:ci`) before requesting review.
