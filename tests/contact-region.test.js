// Issue #32: the contact Edge Function must run in the EU.
//
// Supabase Edge Functions execute in the region nearest the caller unless the
// invocation pins one, and the project's own eu-west-1 governs the database
// only. privacy.html section 3 tells visitors the contact form is processed in
// Ireland, so the pin in app.js is a compliance claim, not a performance
// tweak: drop it and the policy silently stops being true.
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

// Regions inside the EU/EEA, by AWS name. A pin to anything outside this list
// is not a failed test because the pin broke — it is one because privacy.html
// would need rewriting first.
//
// Two AWS regions carry an `eu-` prefix and are not in the EU/EEA:
// `eu-west-2` is London and `eu-central-2` is Zurich. Both are third countries
// under Chapter V — each currently holds an adequacy decision, which is a
// different legal footing from "in the EU" and one the Commission can let
// lapse. They are left out deliberately; re-adding either means rewriting
// section 3 first, not widening this list.
const EU_REGIONS = new Set(['eu-west-1', 'eu-west-3', 'eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-south-2']);

test('the contact form pins the Edge Function to an EU region', () => {
    const declared = appSource.match(/const CONTACT_FUNCTION_REGION = '([a-z0-9-]+)'/);
    assert.ok(declared, 'CONTACT_FUNCTION_REGION is not declared in app.js');
    assert.ok(
        EU_REGIONS.has(declared[1]),
        `CONTACT_FUNCTION_REGION is "${declared[1]}", which is not an EU region; privacy.html section 3 says contact submissions are processed in the EU`
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
