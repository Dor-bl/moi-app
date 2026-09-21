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
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

const appSource = read('app.js');
const workflowSource = read('.github', 'workflows', 'deploy-functions.yml');
const privacySource = read('privacy.html');

// One fact, spelled three ways in three files: the region app.js pins, the
// region the deploy workflow asserts against the live function, and the country
// privacy.html section 3 names to visitors. Two of them can drift silently —
// the workflow does not run on front-end changes, and nobody diffs a policy
// against a constant — so each is checked here against the same pair of values.
//
// An earlier version accepted any EU region and read only app.js. Both were too
// loose: moving the pin to Paris passed, and so did editing the policy or the
// workflow to disagree with it. Changing region is a legitimate thing to want;
// it just has to happen in all three files at once, which is what these
// failures make you do.
const PINNED_REGION = 'eu-west-1';
const PINNED_COUNTRY = 'Ireland';

test('app.js pins the Edge Function to the agreed region', () => {
    const declared = appSource.match(/const CONTACT_FUNCTION_REGION = '([a-z0-9-]+)'/);
    assert.ok(declared, 'CONTACT_FUNCTION_REGION is not declared in app.js');
    assert.equal(
        declared[1],
        PINNED_REGION,
        `CONTACT_FUNCTION_REGION is "${declared[1]}". privacy.html section 3 tells visitors contact submissions are processed in ${PINNED_COUNTRY} (${PINNED_REGION}), and deploy-functions.yml asserts that against the live function. Change all three together or not at all`
    );
});

test('the deploy workflow verifies the same region against the live function', () => {
    const expected = workflowSource.match(/^\s*expected='([a-z0-9-]+)'$/m);
    assert.ok(
        expected,
        "deploy-functions.yml no longer declares `expected='<region>'`. That is the value the live x-sb-edge-region check compares against; if the step was renamed or rewritten, point this test at the new shape rather than deleting it"
    );
    assert.equal(
        expected[1],
        PINNED_REGION,
        `deploy-functions.yml checks the live function against "${expected[1]}" while app.js pins "${PINNED_REGION}". One of them is wrong, and the live check is the one visitors' data actually follows`
    );
});

test('privacy.html tells visitors the country that region is in', () => {
    const section = privacySource.match(/<h2>3\. Where your data is processed<\/h2>([\s\S]*?)<\/section>/);
    assert.ok(
        section,
        'privacy.html no longer has a section 3 headed "Where your data is processed". The disclosure is the point of the pin; if it moved, point this test at where it went'
    );
    assert.match(
        section[1],
        new RegExp(PINNED_COUNTRY),
        `privacy.html section 3 does not mention ${PINNED_COUNTRY}, which is where ${PINNED_REGION} is. Either the pin moved and the policy was not updated, or the policy was reworded into saying something the code does not do`
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
