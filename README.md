# Brown Watches

Watch strap comparison site now scaffolded as a `Next.js + Clerk + Convex + Vercel`
app while preserving the original deck presentations.

## App Structure

- `app/method-1`: authenticated wrapper page for the live deck
- `app/admin`: admin dashboard for reviewing saved respondent feedback
- `public/decks/method-1.html`: preserved original deck
- `public/deck-bridge.js`: sync bridge between the static deck UI and Convex-backed saved state
- `public/deck-feedback.js`: saved like/dislike + comment UI layered onto the static deck
- `convex/`: schema, auth config, and persisted deck preferences

## Required Environment Variables

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`

## Deployment Notes

- This repo does **not** share a Convex project with `jewelry`.
- Current `brown-watches` Convex deployments:
  - local/dev: `majestic-hare-816`
  - prod: `resolute-falcon-799`
- Current production site should use:
  - `NEXT_PUBLIC_CONVEX_URL=https://resolute-falcon-799.convex.cloud`
- Local development can continue to use:
  - `NEXT_PUBLIC_CONVEX_URL=https://majestic-hare-816.convex.cloud`
  - `CONVEX_DEPLOYMENT=dev:majestic-hare-816`
- Do not treat `brown-watches` data and `jewelry` data as interchangeable. They are separate Convex projects under the same team.
- If production behavior looks different from local behavior, check whether the site is pointed at the prod Convex URL before assuming data was deleted.

## Local Notes

- Current local Node is `18.20.4`, which is fine for `Next 14` and `Clerk 6`.
- The current Convex CLI needs a Node 20 runtime to execute cleanly on this machine.
- Use `npx -y node@20 node_modules/convex/bin/main.js <command>` if the regular `npx convex ...` path fails.
