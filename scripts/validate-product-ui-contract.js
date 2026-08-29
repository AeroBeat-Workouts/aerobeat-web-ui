// @ts-check

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isPrototypeTuningIdentity } from "@aerobeat/web-contracts";

const presenters = readFileSync("src/elements/aero-product-presenters.js", "utf8");
const screen = readFileSync("src/screens/aero-calibration-screen/aero-calibration-screen.js", "utf8");
const index = readFileSync("src/index.js", "utf8");
const expectedNames = [
  "elementNames.beatSaverBrowser",
  "elementNames.contentImportProgress",
  "elementNames.contentLibrary",
  "elementNames.calibrationBadge",
  "elementNames.gridPlayfield",
  "elementNames.flowHud",
  "elementNames.boxingTrackHud",
  "elementNames.boxingSpatialHud",
  "elementNames.trackingPause",
  "elementNames.countdown",
  "elementNames.prototypeSelector",
  "elementNames.fullscreenButton",
  '"aero-background-environment"',
  '"aero-capabilities-panel"',
  '"aero-error-panel"'
];
for (const name of expectedNames) {
  assert.ok(presenters.includes(name), `Missing product presenter registration ${name}`);
}
for (const forbidden of ["100vh", "aerobeat-app", "indexedDB.open", "getUserMedia(", "postMessage(", "new Worker(", "readEntry(", "requestFullscreen("]) {
  assert.equal(`${presenters}\n${screen}`.includes(forbidden), false, `UI presenter contains forbidden owner behavior: ${forbidden}`);
}
assert.ok(presenters.includes('"aero:ui:intent"'), "Public UI intent event is missing.");
assert.ok(presenters.includes("bubbles: true, composed: true"), "UI intents are not bubbling and composed.");
assert.ok(presenters.includes("slice(0, 50)"), "BeatSaver result rendering is not deterministically bounded.");
assert.ok(presenters.includes('name="beatsaver-map-choice"') && presenters.includes('data-intent="beatsaver-select-map"'), "BeatSaver map choices are not native scalar-intent radios.");
assert.ok(presenters.includes('name="library-package-choice"') && presenters.includes('data-intent="library-select"') && presenters.includes('"selectedPackageId"'), "Library package choices are not selected native scalar-intent radios.");
for (const action of ["beatsaver-latest", "local-zip-request", "beatsaver-import", "library-export", "library-delete-request"]) assert.ok(presenters.includes(`data-intent="${action}"`), `Music action ${action} is missing.`);
assert.ok(presenters.includes('part="version-select"') && presenters.includes('part="difficulty-select"'), "Version/Difficulty native selects are missing.");
assert.ok(presenters.includes("getRenderSurface()"), "Grid host lacks a public renderer attachment seam.");
assert.ok(presenters.includes("local-zip-request") && !presenters.includes("file.arrayBuffer"), "Local ZIP intent must not carry file bytes.");
assert.ok(presenters.includes("fullscreen-exit") && presenters.includes("library-delete-request"), "Fullscreen exit or delete confirmation intent is missing.");
assert.ok(presenters.includes("handleDelegatedKeydown") && presenters.includes("narrowAeroPresenterSnapshot"), "Keyboard or snapshot-hardening boundary is missing.");
assert.ok(presenters.includes('get compact()') && presenters.includes('set compact(value)') && presenters.includes(':host([compact])'), "Provider-neutral compact property/attribute contract is missing.");
assert.ok(presenters.includes("compact-field-label") && presenters.includes("compact-critical") && presenters.includes("compact-identity"), "Compact accessibility/critical-state boundaries are missing.");
assert.ok(presenters.includes('[part="storage"]') && presenters.includes('[part="items"] span[role="status"]') && presenters.includes('.choice-copy > .muted'), "Compact product-copy suppression boundaries are missing.");
assert.ok(screen.includes("#ensureDom") && screen.includes("#applySnapshot"), "Calibration composition does not preserve media/render surfaces across snapshots.");
for (const profileId of ['id: "flow"', 'id: "semantic-row"', 'id: "spatial-row"', 'id: "semantic-cut"', 'id: "spatial-cut"']) {
  assert.ok(presenters.includes(profileId), `Missing prototype profile ${profileId}`);
}
for (const profileClass of ["live_visual", "between_run_ruleset", "converter_regeneration"]) assert.ok(presenters.includes(`\"${profileClass}\"`), `Missing profile class ${profileClass}.`);
for (const field of ["selectedContentHash", "appliedContentHash", "pendingContentHash", "experimental", "regenerationRequired"]) assert.ok(presenters.includes(field), `Missing bounded profile state field ${field}.`);
for (const forbiddenProfileFeature of ["survey", "winner", "preference", "leaderboard"]) assert.equal(presenters.toLowerCase().includes(forbiddenProfileFeature), false, `Profile presenter contains forbidden promotion feature ${forbiddenProfileFeature}.`);
assert.ok(index.includes("defineAeroProductPresenters"), "Root package does not register product presenters.");
const canonicalIdentity = Object.freeze({ schema: "aerobeat/prototype_tuning_identity", version: 1, profileId: "aero.visual.default", profileVersion: "1.0.0", contentHash: "f".repeat(64), class: "live_visual", regenerationRequired: false });
assert.equal(isPrototypeTuningIdentity(canonicalIdentity), true, "Canonical exact seven-field identity was rejected.");
for (const mutate of [
  (identity) => { delete identity.schema; },
  (identity) => { identity.extra = true; },
  (identity) => { Object.defineProperty(identity, "hidden", { value: true }); },
  (identity) => { identity[Symbol("extra")] = true; },
  (identity) => { identity.profileId = "x".repeat(257); },
  (identity) => { identity.contentHash = "F".repeat(64); },
  (identity) => { identity.regenerationRequired = true; }
]) {
  const candidate = { ...canonicalIdentity };
  mutate(candidate);
  assert.equal(isPrototypeTuningIdentity(candidate), false, "Malformed public tuning identity was accepted.");
}
let getterCalls = 0;
const accessorIdentity = { ...canonicalIdentity };
Object.defineProperty(accessorIdentity, "contentHash", { enumerable: true, get() { getterCalls += 1; return "f".repeat(64); } });
assert.equal(isPrototypeTuningIdentity(accessorIdentity), false);
assert.equal(getterCalls, 0, "Public identity validation executed an accessor.");
console.log("Product UI public contract validation passed.");
