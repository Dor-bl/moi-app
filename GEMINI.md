# Project Guidelines

## Pull Request Workflow
- Whenever instructed to make a change, feature addition, or bug fix, once the work is verified and ready:
  1. Always check out `main` and pull the latest `origin/main` before creating a new branch so feature branches start from a clean state.
  2. Create a descriptive feature/fix branch off `origin/main`.
  3. Review the change locally against [`.claude/skills/moi-review/SKILL.md`](.claude/skills/moi-review/SKILL.md) (in Claude Code, the `moi-review` skill) and fix the confirmed findings.
  4. Commit and push the changes.
  5. Automatically open a GitHub Pull Request, filling in [`.github/pull_request_template.md`](.github/pull_request_template.md) — keep its headings, fill each from the diff, and delete the sections and comment blocks that do not apply.
  6. Tell the owner the PR is ready for review. The required `moi-review` check comes from GitHub, not from the agent: when the owner adds the `moi-review` label, [`moi-review-label.yml`](.github/workflows/moi-review-label.yml) runs Claude Code against the same checklist, posts the review as a PR comment (first line `## ✅ GO — moi-review`, `## ✅ GO, with nits — moi-review` or `## ❌ NO GO — moi-review`), sets the status on the head commit (`success` for GO, `failure` for NO GO) and removes the label. Each run costs API credit, so agents do not add the label themselves, and they do not post the `moi-review` status by hand. A new push gets a new head commit with no status, so it needs the label again.
  7. Do not request a GitHub Copilot review automatically: it runs on GitHub Actions minutes, which this hobby project does not pay for. Request one only when the owner asks.
