# Security Policy

MoiCheck is a free hobby project built and maintained by one person. If you have
found a security problem, thank you — please tell us privately so it can be fixed
before anyone's data is at risk.

## Reporting a vulnerability

Email **[hallo@moicheck.nl](mailto:hallo@moicheck.nl)** with "Security" in the
subject line. English or Dutch is fine.

Please include:

- what the problem is and where (URL, file, or endpoint);
- steps to reproduce it, or a proof of concept;
- what you think the impact is — for example, whether another user's progress,
  memories, or email address could be read or changed.

Please **do not** disclose a vulnerability publicly before it is fixed, and do not
access, modify, or delete other users' data beyond the minimum needed to show
the problem exists.

## What to expect

Because this is maintained by one person in their spare time, these are good-faith
targets rather than guarantees:

- **Acknowledgement** within 7 days of your report.
- **An initial assessment** (whether it is a real issue and how serious) within
  14 days.
- **A fix** as soon as is practical, prioritised by severity. Anything exposing
  personal data comes first.
- A note back to you when it is fixed, and credit in the fix's commit or PR if
  you would like it.

There is no bug bounty — the project earns no money and has none to offer.

## Scope

In scope:

- the site at <https://moicheck.nl>;
- the code in this repository, including the Supabase Edge Function under
  `supabase/functions/` and the database row-level security policies set up
  by the SQL in [`docs/setup/supabase.md`](docs/setup/supabase.md).

Out of scope:

- vulnerabilities in Supabase, Vercel, Resend, Cloudflare, Google, or other
  third-party services themselves — please report those to the provider;
- findings that need a compromised device or browser, or physical access;
- missing best-practice headers or TLS settings with no demonstrated impact;
- denial-of-service, spam, or social-engineering attacks.

## Machine-readable contact

The same contact details are published per [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)
at <https://moicheck.nl/.well-known/security.txt>.
