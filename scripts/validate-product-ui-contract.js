// @ts-check

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
assert.ok(presenters.includes("getRenderSurface()"), "Grid host lacks a public renderer attachment seam.");
assert.ok(presenters.includes("local-zip-request") && !presenters.includes("file.arrayBuffer"), "Local ZIP intent must not carry file bytes.");
for (const profileId of ['id: "flow"', 'id: "semantic-row"', 'id: "spatial-row"', 'id: "semantic-cut"', 'id: "spatial-cut"']) {
  assert.ok(presenters.includes(profileId), `Missing prototype profile ${profileId}`);
}
assert.ok(index.includes("defineAeroProductPresenters"), "Root package does not register product presenters.");
console.log("Product UI public contract validation passed.");
