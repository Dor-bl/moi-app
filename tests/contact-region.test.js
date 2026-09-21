// Issue #32: the contact Edge Function must run in the EU.
//
// Supabase Edge Functions execute in the region nearest the caller unless the
// invocation pins one, and the project's own eu-west-1 governs the database
// only. privacy.html section 3 tells visitors the contact form is processed in
// Ireland, so the pin in app.js is a compliance claim, not a performance
// tweak: drop it or move it and the policy silently stops being true.
//
// This reads app.js as text rather than running it. The file is a classic
// script that wires itself to a live DOM on load — the vm harness the auth
// tests use (tests/helpers/load-auth.js) would need most of a browser to get
// as far as the submit handler, which is a lot of scaffolding to assert one
// URL. The deployed function reports the region it actually ran in through the
// x-sb-edge-region response header; that is the check this cannot replace.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

// The one region the rest of the repository promises. privacy.html section 3
// names Ireland, and the `Verify the pinned region is the region that runs`
// step in .github/workflows/deploy-functions.yml asserts `eu-west-1` against
// the live function. Three places have to agree, and this is the only one that
// runs on a change to app.js.
//
// An earlier version of this test accepted any EU region. That was too loose:
// moving the pin to Paris would have passed here while section 3 still said
// Ireland and the workflow — which does not run on front-end changes — still
// asserted eu-west-1. Changing region is a legitimate thing to want; it just
// has to be done in all three places at once, which is what this failing makes
// you do.
const PINNED_REGION = 'eu-west-1';

test('the contact form pins the Edge Function to the region the policy names', () => {
    const declared = appSource.match(/const CONTACT_FUNCTION_REGION = '([a-z0-9-]+)'/);
    assert.ok(declared, 'CONTACT_FUNCTION_REGION is not declared in app.js');
    assert.equal(
        declared[1],
        PINNED_REGION,
        `CONTACT_FUNCTION_REGION is "${declared[1]}". privacy.html section 3 tells visitors contact submissions are processed in Ireland (${PINNED_REGION}), and deploy-functions.yml asserts that against the live function. Change all three together or not at all`
    );
});

test('the contact request carries the region on the URL', () => {
    const call = appSource.match(/fetch\(`\$\{SUPABASE_URL\}\/functions\/v1\/contact([^`]*)`/);
    assert.ok(call, 'app.js no longer posts to ${SUPABASE_URL}/functions/v1/contact');
    assert.equal(
        call[1],
        '?forceFunctionRegion=${CONTACT_FUNCTION_REGION}',
        'the contact POST must pin its region; without it Supabase runs the function nearest the visitor'
    );
});
