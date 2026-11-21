# Contact form (Supabase Edge Function)

The contact modal posts to an Edge Function rather than a third-party form service —
see [`docs/decisions/formsubmit-gdpr-basis.md`](../decisions/formsubmit-gdpr-basis.md)
for why. The function validates the submission and hands it to Resend, which delivers it
to `hallo@moicheck.nl`.

The POST carries `?forceFunctionRegion=eu-west-1`. Edge Functions otherwise run in the
region nearest the caller — the project's own `eu-west-1` governs the database and nothing
else — so without it a submission from outside the EU is processed outside the EU.
`privacy.html` section 3 tells visitors it is processed in Ireland, which makes that query
parameter a compliance claim rather than a performance tweak; `tests/contact-region.test.js`
fails if it disappears. The reasoning, and why the query parameter rather than the
`x-region` header, is in
[`docs/decisions/edge-function-region.md`](../decisions/edge-function-region.md). The
region a live invocation actually ran in comes back in the `x-sb-edge-region` response
header, which is the only way to confirm it end to end — `deploy-functions.yml` does exactly
that after each deploy and fails if the answer is not `eu-west-1`, so the three places that
have to agree (the pin, the policy, the platform) cannot drift apart quietly.

**The function must be deployed before the client change reaches production**, or the
form will POST to an endpoint that does not exist yet:

```bash
supabase link --project-ref <your-project-ref>   # once
supabase secrets set RESEND_API_KEY=re_xxxxxxxx  # from resend.com/api-keys
supabase functions deploy contact --no-verify-jwt
```

Pushing a change to `supabase/functions/contact/` on `main` now redeploys that
function automatically — only that path, so adding a second function means
extending the workflow rather than relying on it — see `.github/workflows/deploy-functions.yml` — so the commands
above are for the first deploy, for recovering when CI cannot, or for deploying
from a branch before merging. The workflow needs two repository secrets:

| Secret | Value |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | A personal access token from *Account -> Access Tokens* in the Supabase dashboard |
| `SUPABASE_PROJECT_REF` | The project ref, the subdomain of your `*.supabase.co` URL |

Without them the job fails loudly with a message naming what is missing, rather
than appearing to succeed.

After deploying, the job asks the live function for the exact preflight a browser
sends and fails if the answer would not let the POST through — checking the
production origin, a Vercel preview origin, and one origin that must be refused.
The preview probe is not decoration: a preview-origin CORS mismatch is what
started #103, and production can keep working while previews break. If preview
hostnames ever change shape, update both the allow-list in
`supabase/functions/contact/index.ts` and the probe in the workflow.

The workflow pins both `supabase/setup-cli` (to a commit SHA — `@v1` is a branch
upstream, so it moves on its own) and the Supabase CLI version, because that job
runs third-party code with a production deploy token in scope. Bump them
deliberately; a stale pin fails at deploy time, which is the right direction to
fail in.

**`--no-verify-jwt` is required, not optional.** Without it the platform rejects the
browser's CORS preflight before the function runs: preflights carry no `Authorization`
header, so JWT verification has nothing to check and answers 401, and the real POST never
leaves the browser. This was confirmed on the first deploy of this function.

Losing that check costs nothing real. The anon key it would have demanded is published in
`config.js` and served to every visitor, so it never distinguished our form from anyone
else. What actually guards this endpoint is the `application/json` requirement (which
forces the preflight, and with it the origin allow-list, into the path), the honeypot,
the field validation, and the per-address rate limit.

The `from` address (`noreply@moicheck.nl` in `supabase/functions/contact/index.ts`) has
to be on a domain verified with Resend — the same requirement as the magic-link sender
described under [Troubleshooting: magic links fail with a 500](../operations/runbook.md#troubleshooting-magic-links-fail-with-a-500). Delivery failures never reach the visitor; read
them in *Edge Functions -> contact -> Logs* in the Supabase dashboard.

Verify end to end after deploying:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/contact" \
  -H "apikey: <publishable-key>" \
  -H "Content-Type: application/json" \
  -H "Origin: https://moicheck.nl" \
  -d '{"name":"Test","email":"you@example.com","subject":"Say Moi","message":"Test"}'
```

A `{"ok":true}` and a message in the inbox means the function itself works.

That is only half the check, and the weaker half. The browser sends a CORS preflight
before the real POST, because the client sets `apikey` and a JSON
content type — none of which are on the fetch safelist. The curl above sends no
preflight, so it passes even when the preflight would fail, and the form would then be
broken for every visitor while this check still looked green. Ask for the preflight
explicitly:

```bash
curl -i -X OPTIONS "https://<project-ref>.supabase.co/functions/v1/contact" \
  -H "Origin: https://moicheck.nl" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey, content-type"
```

Expect a 200 carrying `access-control-allow-origin: https://moicheck.nl`. A **401 here
means the function was deployed without `--no-verify-jwt`** — the platform rejected the
preflight before the function saw it. Redeploy with the flag and repeat.

Then submit the real form once from the deployed site, which is the only check that
exercises the whole path at once.

Spam handling is deliberately small: a honeypot field the form fills only for bots, and a
per-instance rate limit. If that ever stops being enough, add Cloudflare Turnstile rather
than building a shared-state limiter.

The function also refuses anything that is not `application/json`. That looks like a
formality and is not: `text/plain` is on the fetch safelist, so without the check a page
on any origin could post a JSON body under that type, skip the preflight entirely, and
have its visitors send mail through us — the origin allow-list never gets consulted.
Requiring a content type outside the safelist is what forces the preflight, and with it
the allow-list, back into the path.
