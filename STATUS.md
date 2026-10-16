# Project Status

## Goal
- Preserve the local source edits and retire this MacBook Pro checkout and live site.

## Current state
- Existing source edits are included in this archival checkpoint.
- Automatic Vercel deployments are intentionally disabled by git.deploymentEnabled=false in vercel.json.
- Project pausing is a separate Vercel account operation; this source setting does not itself stop an existing production deployment.

## Last verified
- 2026-10-16T14:15:03-05:00 - Existing source passed the production build; no source changes occurred after the reviewed recovery snapshot. Deployment-disable configuration parsed successfully.

## Next step
- Restore from GitHub if development resumes; explicitly review and reenable deployment settings before a release.

## Blockers / decisions
- Retirement was explicitly requested on 2026-10-16. Preserve existing database and account resources.
- Runtime/browser state is excluded from Git and remains recoverable in Trash when this checkout is removed.
