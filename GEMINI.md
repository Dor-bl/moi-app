# Project Guidelines

## Pull Request Workflow
- Whenever instructed to make a change, feature addition, or bug fix, once the work is verified and ready:
  1. Always check out `main` and pull the latest `origin/main` before creating a new branch so feature branches start from a clean state.
  2. Create a descriptive feature/fix branch off `origin/main`.
  3. Review the change locally against [`.claude/skills/moi-review/SKILL.md`](.claude/skills/moi-review/SKILL.md) (in Claude Code, the `moi-review` skill) and fix the confirmed findings.
  4. Commit and push the changes.
  5. Automatically open a GitHub Pull Request, filling in [`.github/pull_request_template.md`](.github/pull_request_template.md) — keep its headings, fill each from the diff, and delete the sections and comment blocks that do not apply.
  6. Publish the step 3 review on the PR so the owner can see it on GitHub. Do the same after re-reviewing a later round of changes.
     - **Comment** (`gh pr comment <PR_NUMBER> --body-file <file>`). Its first line is the verdict: `## ✅ GO — moi-review`, `## ✅ GO, with nits — moi-review`, or `## ❌ NO GO — moi-review` (any open blocking finding). Then each finding, labelled verified or suspected, with how it was resolved; what was checked; and a **Not checked** line (see the skill's "Reporting findings").
     - **Commit status** `moi-review` on the reviewed head commit, so the verdict shows in the PR's checks next to CI. It is a required check on `main`, and a GO is the owner's sign-off: the owner adds the `moi-review: go` label to the PR, and [`moi-review-label.yml`](.github/workflows/moi-review-label.yml) posts `success` on the current head commit and removes the label again. Agents do not add that label; they post the comment and tell the owner the PR is ready for it. A NO GO is posted directly: `gh api repos/Dor-bl/moi-app/statuses/<HEAD_SHA> -f state=failure -f context=moi-review -f description="NO GO: <one line>" -f target_url=<comment URL>`. A new push gets a new head commit with no status, which shows that the latest round has not been reviewed yet; it needs the label again.
  7. Do not request a GitHub Copilot review automatically: it runs on GitHub Actions minutes, which this hobby project does not pay for. Request one only when the owner asks.
