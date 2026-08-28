// @ts-check

import { defineAeroUiElements } from "@aerobeat/web-this-repo";

defineAeroUiElements();

const snapshots = Object.freeze({
  "aero-beatsaver-browser": Object.freeze({ state: "empty", query: "Example", results: [] }),
  "aero-content-import-progress": Object.freeze({ state: "converting", progress: 0.42, jobId: "debug-job" }),
  "aero-content-library": Object.freeze({ usedBytes: 2048, quotaBytes: 8192, packages: [] }),
  "aero-calibration-badge": Object.freeze({ state: "cooldown", progress: 1, message: "Relax your arms before continuing." }),
  "aero-grid-playfield": Object.freeze({ mode: "flow", dimmed: false }),
  "aero-flow-hud": Object.freeze({ score: 1200, combo: 12, direction: "Up" }),
  "aero-boxing-track-hud": Object.freeze({ leftAction: "Hook", rightAction: "Straight", defense: "Guard" }),
  "aero-boxing-spatial-hud": Object.freeze({ target: "Left hook · cell 6", blockedCells: [0, 1], safeCell: 10 }),
  "aero-tracking-pause": Object.freeze({ active: true, message: "Tracking lost", reason: "tracking_lost" }),
  "aero-resume-countdown": Object.freeze({ active: true, value: 3, frozen: true }),
  "aero-background-environment": Object.freeze({ label: "Default gradient", fallback: true }),
  "aero-fullscreen-button": Object.freeze({ supported: true, active: false, requestPending: false }),
  "aero-capabilities-panel": Object.freeze({ camera: true, fullscreen: true, autoplay: false, webgl2: true, indexedDb: true, worker: true, directBeatSaverCors: true, localZipImport: true, limitations: ["autoplay_requires_gesture"] }),
  "aero-error-panel": Object.freeze({ code: "audio_decode_failed", message: "This map's audio codec is not supported.", retryable: false }),
  "aero-prototype-selector": Object.freeze({ selectedProfileId: "spatial-cut", tuningIdentities: [{ profileId: "cut-family", profileVersion: "1", contentHash: "debug", class: "converter_regeneration", regenerationRequired: true }] })
});

for (const [name, snapshot] of Object.entries(snapshots)) {
  const element = document.querySelector(name);
  if (element && "setSnapshot" in element && typeof element.setSnapshot === "function") element.setSnapshot(snapshot);
}
