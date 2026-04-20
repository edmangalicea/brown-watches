# Brown Watches

Watch strap comparison site now scaffolded as a `Next.js + Clerk + Convex + Vercel`
app while preserving the original deck presentations.

## App Structure

- `app/method-1` and `app/method-2`: authenticated wrapper pages
- `public/decks/method-1.html`: preserved original deck
- `public/decks/method-2.html`: preserved timeless-first deck
- `public/deck-bridge.js`: sync bridge between the static deck UI and Convex-backed saved state
- `convex/`: schema, auth config, and persisted deck preferences

## Required Environment Variables

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`

## Local Notes

- Current local Node is `18.20.4`, which is fine for `Next 14` and `Clerk 6`.
- The current Convex CLI needs a Node 20 runtime to execute cleanly on this machine.
- Use `npx -y node@20 node_modules/convex/bin/main.js <command>` if the regular `npx convex ...` path fails.
