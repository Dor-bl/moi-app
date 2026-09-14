# Project Guidelines

## Pull Request Workflow
- Whenever instructed to make a change, feature addition, or bug fix, once the work is verified and ready:
  1. Always check out `main` and pull the latest `origin/main` before creating a new branch so feature branches start from a clean state.
  2. Create a descriptive feature/fix branch off `origin/main`.
  3. Commit and push the changes.
  4. Automatically open a GitHub Pull Request, filling in [`.github/pull_request_template.md`](.github/pull_request_template.md) — keep its headings, fill each from the diff, and delete the sections and comment blocks that do not apply.

## Vercel Previews & Origin Allowlisting
- The Vercel project is named `moi`, producing preview URLs of the form `https://moi-<hash>-blayzer.vercel.app`.
- Any origin validation (CORS in Edge Functions, Supabase redirect URLs, etc.) must match both `moi-` and `moi-app-` prefixes with the `-blayzer` scope suffix:
  `/^https:\/\/moi(-app)?-[a-z0-9-]+-blayzer\.vercel\.app$/`

## Supabase Edge Functions
- When deploying public Edge Functions (such as `contact`) that receive browser requests with preflights (`OPTIONS`), always deploy with `--no-verify-jwt`. Preflights carry no auth headers and will be rejected with 401 if JWT verification is enforced at the gateway.

## Windows Environment & GitHub Automation
- For GitHub API calls or CLI tasks, read `GH_TOKEN` from the Windows User environment:
  `[Environment]::GetEnvironmentVariable("GH_TOKEN", "User")`
- Prefer native PowerShell (`Invoke-RestMethod` with `$payload | ConvertTo-Json`) over `curl.exe` when sending JSON payloads on Windows to avoid quote-stripping and argument-splitting errors.
