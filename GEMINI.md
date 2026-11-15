# Project Guidelines

## Pull Request Workflow
- Whenever instructed to make a change, feature addition, or bug fix, once the work is verified and ready:
  1. Always check out `main` and pull the latest `origin/main` before creating a new branch so feature branches start from a clean state.
  2. Create a descriptive feature/fix branch off `origin/main`.
  3. Review the change locally against [`.claude/skills/moi-review/SKILL.md`](.claude/skills/moi-review/SKILL.md) (in Claude Code, the `moi-review` skill) and fix the confirmed findings.
  4. Commit and push the changes.
  5. Automatically open a GitHub Pull Request, filling in [`.github/pull_request_template.md`](.github/pull_request_template.md) — keep its headings, fill each from the diff, and delete the sections and comment blocks that do not apply.
  6. Publish the step 3 review on the PR so the owner can see it on GitHub. Do the same after re-reviewing a later round of changes.
     - **Comment** (`gh pr comment <PR_NUMBER> --body-file <file>`). Its first line is the verdict: `## ✅ GO — moi-review`, `## ✅ GO, with nits — moi-review`, or `## ❌ NO GO — moi-review` (any open blocking finding). Then each finding with how it was resolved, and what was checked.
     - **Commit status** on the reviewed head commit, so the verdict shows in the PR's checks next to CI. This is a plain API call and uses no Actions minutes: `gh api repos/Dor-bl/moi-app/statuses/<HEAD_SHA> -f state=<success|failure> -f context=moi-review -f description="<GO|GO, with nits|NO GO>: <one line>" -f target_url=<comment URL>`. Use `success` for GO and `failure` for NO GO. A new push gets a new head commit with no status, which shows that the latest round has not been reviewed yet.
  7. Do not request a GitHub Copilot review automatically: it runs on GitHub Actions minutes, which this hobby project does not pay for. Request one only when the owner asks.
