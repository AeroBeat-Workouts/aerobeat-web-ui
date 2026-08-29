// @ts-check

import {
  AeroBeatSaverBrowser,
  AeroBoxingSpatialHud,
  AeroBoxingTrackHud,
  AeroCalibrationBadge,
  AeroCapabilitiesPanel,
  AeroContentImportProgress,
  AeroContentLibrary,
  AeroFlowHud,
  AeroFullscreenButton,
  AeroGridPlayfield,
  AeroPrototypeSelector,
  AeroResumeCountdown,
  AeroTrackingPause,
  aeroUiIntentEventName,
  defineAeroUiElements
} from "@aerobeat/web-this-repo";

defineAeroUiElements();
const app = document.querySelector("#app");
if (!(app instanceof HTMLElement)) throw new Error("Product UI validation root is missing.");

/** @type {Array<{type: string, payload: Readonly<Record<string, string | number | boolean | null>>}>} */
const intents = [];
app.addEventListener(aeroUiIntentEventName, (event) => {
  if (event instanceof CustomEvent && typeof event.detail?.type === "string") intents.push(event.detail);
});

const browser = document.createElement("aero-beatsaver-browser");
if (!(browser instanceof AeroBeatSaverBrowser)) throw new Error("BeatSaver browser registration failed.");
const browserResultsSnapshot = Object.freeze({
  state: "results",
  query: "Papercut",
  results: Array.from({ length: 55 }, (_, index) => ({ mapId: `map-${index}`, name: `Map ${index}`, songAuthorName: "Artist" })),
  selectedMap: { mapId: "4858", name: "Papercut", songAuthorName: "Linkin Park", levelAuthorName: "Mapper" },
  versions: [{ versionHash: "a".repeat(40), label: "Current version" }],
  difficulties: ["Hard", "Expert"],
  selectedVersionHash: "a".repeat(40),
  selectedDifficulty: "Expert"
});
browser.setSnapshot(browserResultsSnapshot);
app.append(browser);
const browserStateTexts = {};
for (const snapshot of [
  { state: "loading", results: [] },
  { state: "empty", results: [] },
  { state: "failed", results: [], errorMessage: "Provider unavailable" }
]) {
  browser.setSnapshot(snapshot);
  browserStateTexts[snapshot.state] = browser.shadowRoot?.querySelector("[role='status']")?.textContent ?? "";
}
browser.setSnapshot(browserResultsSnapshot);

const progress = document.createElement("aero-content-import-progress");
if (!(progress instanceof AeroContentImportProgress)) throw new Error("Import progress registration failed.");
progress.setSnapshot({ state: "converting", progress: 0.63, jobId: "job-1" });
app.append(progress);

const library = document.createElement("aero-content-library");
if (!(library instanceof AeroContentLibrary)) throw new Error("Library registration failed.");
library.setSnapshot({ usedBytes: 1024 * 1024, quotaBytes: 8 * 1024 * 1024, packages: [{ packageId: "package-1", name: "Papercut", variantCount: 5 }] });
app.append(library);

const calibration = document.createElement("aero-calibration-badge");
if (!(calibration instanceof AeroCalibrationBadge)) throw new Error("Calibration badge registration failed.");
app.append(calibration);
const calibrationStateTexts = {};
for (const state of ["waiting", "holding", "cooldown", "calibrated", "error"]) {
  calibration.setSnapshot({ state, progress: state === "calibrated" ? 1 : 0.5 });
  calibrationStateTexts[state] = calibration.shadowRoot?.querySelector("[role='status']")?.textContent ?? "";
}
calibration.setSnapshot({ state: "holding", progress: 0.75, message: "Hold your T-pose", calibrationId: "cal-1" });

const capabilities = document.createElement("aero-capabilities-panel");
if (!(capabilities instanceof AeroCapabilitiesPanel)) throw new Error("Capabilities registration failed.");
capabilities.setSnapshot({ camera: true, fullscreen: true, autoplay: false, webgl2: true, indexedDb: true, worker: true, directBeatSaverCors: true, localZipImport: true, limitations: ["autoplay_requires_gesture"] });
app.append(capabilities);

const selector = document.createElement("aero-prototype-selector");
if (!(selector instanceof AeroPrototypeSelector)) throw new Error("Prototype selector registration failed.");
selector.setSnapshot({ selectedProfileId: "semantic-row", sessionState: "playing", profileClasses: [
  { class: "live_visual", active: { profileId: "aero.visual.default", profileVersion: "1.0.0", contentHash: "fdcf478c91e21ef88970299e29fcc35d574bfe69e0d7d00d9f823ee9507f39a3", class: "live_visual", experimental: true, regenerationRequired: false }, profiles: [{ profileId: "aero.visual.default", profileVersion: "1.0.0", contentHash: "fdcf478c91e21ef88970299e29fcc35d574bfe69e0d7d00d9f823ee9507f39a3", class: "live_visual", experimental: true, regenerationRequired: false }, { profileId: "aero.visual.compact", profileVersion: "1.0.0", contentHash: "e65d53dfaafe8a859c08837acb3d447b10b03508bd5ae64677d273c93657d603", class: "live_visual", experimental: true, regenerationRequired: false }] },
  { class: "between_run_ruleset", active: { profileId: "aero.scoring.locked", profileVersion: "1.0.0", contentHash: "0df07b0502381012cc6f46da3c99edd4a5f4999731e54a440a2785f830c5bda5", class: "between_run_ruleset", experimental: true, regenerationRequired: false }, profiles: [{ profileId: "aero.scoring.locked", profileVersion: "1.0.0", contentHash: "0df07b0502381012cc6f46da3c99edd4a5f4999731e54a440a2785f830c5bda5", class: "between_run_ruleset", experimental: true, regenerationRequired: false }] },
  { class: "converter_regeneration", active: { identity: { profileId: "aero.converter.prototype-reach", profileVersion: "1.0.0", contentHash: "e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea", class: "converter_regeneration", experimental: true, regenerationRequired: true }, appliedContentHash: "a43b53a39c13c9e9efe59854aee0fa16efdcd3c6a29bc09f678d94b3fd8f0202", regenerationRequired: true }, selectedContentHash: "e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea", appliedContentHash: "a43b53a39c13c9e9efe59854aee0fa16efdcd3c6a29bc09f678d94b3fd8f0202", pendingContentHash: "e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea", regenerationRequired: true, profiles: [{ profileId: "aero.converter.canonical", profileVersion: "1.0.0", contentHash: "a43b53a39c13c9e9efe59854aee0fa16efdcd3c6a29bc09f678d94b3fd8f0202", class: "converter_regeneration", experimental: true, regenerationRequired: false }, { profileId: "aero.converter.prototype-reach", profileVersion: "1.0.0", contentHash: "e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea", class: "converter_regeneration", experimental: true, regenerationRequired: true }] }
] });
app.append(selector);

const gameHost = document.createElement("section");
gameHost.className = "game-host";
const playfield = document.createElement("aero-grid-playfield");
if (!(playfield instanceof AeroGridPlayfield)) throw new Error("Grid playfield registration failed.");
playfield.setSnapshot({ mode: "spatial boxing", dimmed: true, label: "Dim retained spatial grid" });
const pause = document.createElement("aero-tracking-pause");
if (!(pause instanceof AeroTrackingPause)) throw new Error("Tracking pause registration failed.");
pause.setSnapshot({ active: true, message: "Tracking lost", reason: "tracking_lost" });
const countdown = document.createElement("aero-resume-countdown");
if (!(countdown instanceof AeroResumeCountdown)) throw new Error("Countdown registration failed.");
countdown.setSnapshot({ active: true, value: 3, frozen: true });
gameHost.append(playfield, pause, countdown);
app.append(gameHost);
const flowHud = document.createElement("aero-flow-hud");
const trackHud = document.createElement("aero-boxing-track-hud");
const spatialHud = document.createElement("aero-boxing-spatial-hud");
if (!(flowHud instanceof AeroFlowHud) || !(trackHud instanceof AeroBoxingTrackHud) || !(spatialHud instanceof AeroBoxingSpatialHud)) throw new Error("Gameplay HUD registration failed.");
flowHud.setSnapshot({ score: 100, combo: 3, direction: "Up" });
trackHud.setSnapshot({ leftAction: "Hook", rightAction: "Straight", defense: "Guard" });
spatialHud.setSnapshot({ target: "Cell 6", blockedCells: [0, 1], safeCell: 10 });
app.append(flowHud, trackHud, spatialHud);

const fullscreen = document.createElement("aero-fullscreen-button");
if (!(fullscreen instanceof AeroFullscreenButton)) throw new Error("Fullscreen registration failed.");
app.append(fullscreen);
fullscreen.setSnapshot({ supported: false, active: false, requestPending: false, errorCode: null });
const fullscreenDisabledWhenUnsupported = fullscreen.shadowRoot?.querySelector("button")?.hasAttribute("disabled") ?? false;
fullscreen.setSnapshot({ supported: true, active: false, requestPending: false, errorCode: null });

const searchInput = browser.shadowRoot?.querySelector("input[data-field='query']");
if (searchInput instanceof HTMLInputElement) searchInput.value = "Forklift";
browser.shadowRoot?.querySelector("form")?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
browser.shadowRoot?.querySelector("button[data-intent='local-zip-request']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
browser.shadowRoot?.querySelector("button[data-intent='beatsaver-import']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const difficultySelect = browser.shadowRoot?.querySelector("select[data-intent='beatsaver-difficulty-select']");
if (difficultySelect instanceof HTMLSelectElement) {
  difficultySelect.value = "Hard";
  difficultySelect.dispatchEvent(new Event("change", { bubbles: true }));
}
progress.shadowRoot?.querySelector("button[data-intent='content-import-cancel']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
library.shadowRoot?.querySelector("button[data-intent='library-delete-request']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
library.shadowRoot?.querySelector("button[data-intent='library-delete']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
selector.shadowRoot?.querySelector("button[data-value='spatial-cut']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
selector.shadowRoot?.querySelector("button[data-value='aero.visual.compact']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
selector.shadowRoot?.querySelector("button[data-intent='tuning-import-request']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
selector.shadowRoot?.querySelector("button[data-intent='tuning-export']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
selector.shadowRoot?.querySelector("button[data-intent='tuning-reset']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
playfield.style.setProperty("--aero-role-receptor", "#123456");

fullscreen.shadowRoot?.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
fullscreen.setSnapshot({ supported: true, active: true, requestPending: false, errorCode: null });
fullscreen.shadowRoot?.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
fullscreen.setSnapshot({ supported: true, active: false, requestPending: false, errorCode: null });
fullscreen.remove();
app.append(fullscreen);
fullscreen.shadowRoot?.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

window.__aeroProductUiValidation = Object.freeze({
  boundedResults: browser.shadowRoot?.querySelectorAll("[part='result']").length ?? -1,
  browserStateTexts,
  searchStatus: browser.shadowRoot?.querySelector("[role='status']")?.textContent ?? "",
  importStatus: progress.shadowRoot?.querySelector("[role='status']")?.textContent ?? "",
  libraryButtons: library.shadowRoot?.querySelectorAll("button").length ?? -1,
  calibrationProgress: calibration.shadowRoot?.querySelector("progress")?.getAttribute("value") ?? "",
  calibrationStateTexts,
  capabilityLabels: capabilities.shadowRoot?.querySelectorAll(".pill").length ?? -1,
  profileCount: selector.shadowRoot?.querySelectorAll("[role='radio']").length ?? -1,
  checkedProfile: selector.shadowRoot?.querySelector("[aria-checked='true']")?.textContent ?? "",
  regenerationText: selector.shadowRoot?.querySelector("[part='telemetry']")?.textContent ?? "",
  managedProfileClasses: selector.shadowRoot?.querySelectorAll("article[data-profile-class]").length ?? -1,
  deterministicProfileState: `${selector.getProfilePresenterState().profileClasses.map((state) => state.class).join(",")}|${Object.isFrozen(selector.getProfilePresenterState())}`,
  scoringDisabled: selector.shadowRoot?.querySelector("article[data-profile-class='between_run_ruleset'] button")?.hasAttribute("disabled") ?? false,
  scoringStatus: selector.shadowRoot?.querySelector("article[data-profile-class='between_run_ruleset'] [role='status']")?.textContent ?? "",
  converterStatus: selector.shadowRoot?.querySelector("article[data-profile-class='converter_regeneration']")?.textContent ?? "",
  renderSurface: Boolean(playfield.getRenderSurface()),
  cellCount: playfield.shadowRoot?.querySelectorAll("[data-cell]").length ?? -1,
  pauseRole: pause.shadowRoot?.querySelector("[role='alertdialog']")?.getAttribute("role") ?? "",
  countdownText: countdown.shadowRoot?.textContent ?? "",
  hudText: `${flowHud.shadowRoot?.textContent ?? ""} ${trackHud.shadowRoot?.textContent ?? ""} ${spatialHud.shadowRoot?.textContent ?? ""}`,
  fullscreenDisabledWhenUnsupported,
  fullscreenIntentCount: intents.filter((intent) => intent.type === "fullscreen-request").length,
  fullscreenExitIntentCount: intents.filter((intent) => intent.type === "fullscreen-exit").length,
  themeToken: getComputedStyle(playfield).getPropertyValue("--aero-role-receptor").trim(),
  intents
});
