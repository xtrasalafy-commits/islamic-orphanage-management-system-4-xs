# AGENTS.md - Build & Development Guide

## Commands

- **Typecheck:** `tsc --noEmit` (add `--max-old-space-size=512` with `node --max-old-space-size=512 node_modules/typescript/bin/tsc`)
- **Build:** `NODE_OPTIONS="--max-old-space-size=512" next build --webpack`
- **Lint:** `eslint .` (may require increased memory; check specific files individually)
- **Dev:** `next dev`

## Notes

- Use `--webpack` flag for build (Turbopack causes Rust memory allocation failures on this machine)
- All API routes are dynamic (serverless); use HTTP queries instead of long-lived connections
- Database uses `@neondatabase/serverless` for Neon HTTP driver compatibility with Vercel
