# Project Guidelines

## Pull Request Workflow
- Whenever instructed to make a change, feature addition, or bug fix, once the work is verified and ready:
  1. Always check out `main` and pull the latest `origin/main` before creating a new branch so feature branches start from a clean state.
  2. Create a descriptive feature/fix branch off `origin/main`.
  3. Review the change locally against [`.claude/skills/moi-review/SKILL.md`](.claude/skills/moi-review/SKILL.md) (in Claude Code, the `moi-review` skill) and fix the confirmed findings.
  4. Commit and push the changes.
  5. Automatically open a GitHub Pull Request, filling in [`.github/pull_request_template.md`](.github/pull_request_template.md) — keep its headings, fill each from the diff, and delete the sections and comment blocks that do not apply.
  6. Post the step 3 review on the PR as a comment (`gh pr comment <PR_NUMBER> --body-file <file>`): the verdict, each finding with how it was resolved, and what was checked, so the owner can see it on GitHub. Do the same after re-reviewing a later round of changes.
  7. Do not request a GitHub Copilot review automatically: it runs on GitHub Actions minutes, which this hobby project does not pay for. Request one only when the owner asks.
