# Personal data: consent, retention and deletion

## Why there is no cookie banner

Everything MoiCheck stores on a visitor's device is exempt from the ePrivacy consent
requirement, on one of three grounds: it is the service itself (completed items and
notes), a preference the visitor set (theme, language, completed-list layout), or strictly
necessary for sign-in, which only happens because they asked to sign in (the Supabase
session token and the account marker). The event check-in is on the same footing: reading a
position is in scope for the rule, and it is exempt because it happens only inside a tap on
a button whose whole meaning is "confirm I am here" — nothing is read in the background and
no coordinate is kept. The key-by-key reasoning, and what would change it,
is written up in
[`docs/decisions/consent-exemption-analysis.md`](../decisions/consent-exemption-analysis.md);
`privacy.html` section 6 states the same thing in plain language for visitors. Add a new
storage key that fits none of those three grounds and that analysis needs revisiting.

## What personal data MoiCheck holds, and for how long

Two documents under `docs/compliance/` answer this, so it does not have to be reconstructed
from the code:

- [`processing-register.md`](processing-register.md) — the GDPR Article 30
  record. Ten entries — eight processing activities with their purposes, data categories,
  processors, transfers, retention and safeguards, plus two boundary records. Activities 9 and 10 exist to mark the boundary: what
  stays on the device — and the one thing that doesn't, since progress made while signed out
  is merged into the account on sign-in — and the fact that there is no profiling or
  automated decision-making.
- [`retention.md`](retention.md) — how long each category lives, which
  provider holds what for how long, and the written position on backups versus erasure.

Two more sit beside them: [`breach-runbook.md`](breach-runbook.md) for when
something has leaked, and
[`account-hosting-audit.md`](account-hosting-audit.md) for which account holds
which credential and which region each service runs in.

`privacy.html` is the public statement of the same facts. **Change the code, check both**: a
new table, column or `localStorage` key changes the register, and a new storage key also means
revisiting the consent-exemption analysis above.

## Account deletion (GDPR right to erasure)

Signed-in users can delete their account and data from the profile modal (*Delete my account & data*).
The anon key cannot touch `auth.users`, so the deletion runs through a `delete_user()`
database function. Run this in the Supabase SQL Editor:

```sql
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from public.user_progress where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_user() from public, anon;
grant execute on function delete_user() to authenticated;
```

The function runs as its owner (`security definer`) but only deletes the authenticated caller's own rows, `set search_path = ''` stops search path hijacking, and grants ensure only authenticated users can invoke it.

If your `user_progress` table predates the `on delete cascade` on `user_id`, update the foreign key constraint:

```sql
alter table user_progress drop constraint user_progress_user_id_fkey;
alter table user_progress add constraint user_progress_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
```

If the function is not configured on the Supabase project, the app informs the user that self-service deletion is not yet available and provides contact info for manual removal.

## Dormant accounts are deleted after 24 months

An account nobody has used for 24 months is deleted, with its progress and notes, by a
nightly `pg_cron` job. This is the retention period `privacy.html` §4 states; the reasoning,
and why there is no warning email, is in
[`docs/compliance/retention.md`](retention.md) §2.

"Used" cannot be read from `last_sign_in_at` alone. The SDK refreshes a session without
signing in again, so an account can be in daily use while that timestamp stays at its first
visit. A refresh does update the session row (`updated_at`, `refreshed_at`), but signing out
deletes that row, so the session tables forget the activity at exactly the moment it matters.
A small table, `account_last_seen`, keeps it: a job at 20 minutes past every hour copies each
live session's latest timestamp into it, and the deletion at 03:23 reads it.

The deletion removes the `auth.users` row and nothing else. Everything that points at it —
`user_progress`, `account_last_seen`, `profiles`, sessions, refresh tokens, identities — is
`on delete cascade`. Both jobs run as `postgres` inside the database, so nothing new is
exposed through the API, and `delete_user()` keeps its self-only check. Run this once in the
Supabase SQL Editor:

```sql
create extension if not exists pg_cron with schema pg_catalog;

create table public.account_last_seen (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null
);
alter table public.account_last_seen enable row level security;
revoke all on public.account_last_seen from anon, authenticated;

-- Backfill once from today's sessions, so the deletion never runs on an empty table.
insert into public.account_last_seen (user_id, seen_at)
select user_id, max(greatest(updated_at, refreshed_at at time zone 'UTC'))
from auth.sessions
group by user_id
on conflict (user_id) do nothing;

select cron.schedule(
  'record-account-activity',
  '20 * * * *',
  $$
  insert into public.account_last_seen (user_id, seen_at)
  select user_id, max(greatest(updated_at, refreshed_at at time zone 'UTC'))
  from auth.sessions
  group by user_id
  on conflict (user_id) do update
    set seen_at = greatest(account_last_seen.seen_at, excluded.seen_at)
  $$
);

select cron.schedule(
  'delete-dormant-accounts',
  '23 3 * * *',
  $$
  delete from auth.users u
  where greatest(u.created_at, u.last_sign_in_at,
                 (select l.seen_at from public.account_last_seen l where l.user_id = u.id))
        < now() - interval '24 months'
    and not exists (
      select 1 from auth.sessions s
      where s.user_id = u.id
        and greatest(s.updated_at, s.refreshed_at at time zone 'UTC') >= now() - interval '24 months')
  $$
);
```

`refreshed_at` is stored without a time zone (in UTC), hence the cast. The live-session check
in the deletion repeats what the hourly job records, so a failed copy cannot delete an account
in use.

What it can still miss: a visit that resumes an existing session (no new sign-in) and is
followed by a sign-out before the next hourly copy. That visit is never recorded, so the 24
months run from the use recorded before it, and the account can be deleted that much earlier
than 24 months after the visit. A fresh sign-in is always recorded (`last_sign_in_at`), so it
takes a resumed session, a sign-out within the hour, and no visit after that. Closing it would
need a trigger on Supabase's own `auth.sessions` table. It would run inside every sign-out, and
inside the cascade when an account is deleted, so a fault in it would break both. That is not
done; see `retention.md` §2.

To see who the next run would delete, run the same `where` clause as a `select u.id, u.email, u.last_sign_in_at from auth.users u where …`.
Change the window in both `privacy.html` §4 and this job, never one alone.
