# CamOdevOps AI Team — Communication Channel

This repo IS the team's communication channel. No external chat service required.
Everything is version-controlled, headless-friendly, and agent-maintainable.

## How the team communicates
- **Messages / threads** → `comms.md` (append an entry; one block per message)
- **Standup** → `standup.md` (daily: did / doing / blocked)
- **Decisions** → `decisions.md` (ADR-style: what we decided + why)
- **Tasks** → `tasks.md` (TODO / in-progress / done, owner per line)
- **Roster** → `members.md` (who's on the team + role + GitHub handle)

## Conventions
- Append, don't rewrite history. Each entry = a dated block:
  ```
  ## [2026-08-01] @camo — topic
  body...
  ```
- The agent (Hermes) appends status to `comms.md` and `STATUS.md` each session.
- Use PRs for proposed changes; the repo owner merges to `main`.
- Branch `claude-setup` holds the setup tooling; team comms live on `main` in `team/`.

## Upgrading to GitHub-native notifications (optional)
If you want @mentions + email/UI notifications, enable in repo Settings:
- **Issues** (Settings → General → Features → Issues) — I can file items via API with a token
- **Discussions** (Settings → General → Features → Discussions) — Q&A / announcements
Provide a GitHub PAT (repo scope) and the agent can script issue creation.
Until then, this markdown channel is the source of truth.
