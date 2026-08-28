// @ts-check

import { chromium } from "playwright";
import { rmSync } from "node:fs";
import { createServer } from "vite";

rmSync("node_modules/.vite", { recursive: true, force: true });
const server = await createServer({ appType: "mpa", configFile: false, logLevel: "error", root: ".", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const url = server.resolvedUrls?.local?.[0];
if (!url) {
  await server.close();
  throw new Error("Vite did not expose a product UI validation URL.");
}

/** @type {string[]} */
const consoleNoise = [];
/** @type {string[]} */
const pageErrors = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  page.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") consoleNoise.push(`${message.type()}: ${message.text()}`); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
  const result = await page.evaluate(() => window.__aeroProductUiValidation);
  assert(result.boundedResults === 50, "BeatSaver result rendering was not bounded to 50 entries.");
  assert(result.browserStateTexts.loading.includes("Loading") && result.browserStateTexts.empty.includes("No compatible") && result.browserStateTexts.failed.includes("Provider unavailable"), "BeatSaver loading/empty/error states were incomplete.");
  assert(result.searchStatus.includes("50 maps"), "Bounded result count was not announced.");
  assert(result.importStatus.includes("63%"), "Conversion progress was not announced.");
  assert(result.libraryButtons === 3, "Library select/export/delete controls were not rendered.");
  assert(result.calibrationProgress === "0.75", "Calibration hold progress was not exposed.");
  for (const state of ["waiting", "holding", "cooldown", "calibrated", "error"]) assert(result.calibrationStateTexts[state].length > 0, `Calibration ${state} state was not announced.`);
  assert(result.capabilityLabels === 8, "Capability availability was incomplete.");
  assert(result.profileCount === 5, "Flow plus four Boxing profile choices were not rendered.");
  assert(result.checkedProfile.includes("Semantic Track"), "Selected prototype did not expose checked state.");
  assert(result.regenerationText.includes("Regeneration required"), "Converter tuning did not expose regeneration-required telemetry.");
  assert(result.renderSurface === true && result.cellCount === 12, "Grid host did not expose its public surface and 4x3 receptors.");
  assert(result.pauseRole === "alertdialog", "Tracking pause was not exposed as an accessible modal alert.");
  assert(result.countdownText.includes("Workout time frozen"), "Countdown did not announce frozen workout time.");
  assert(result.hudText.includes("Flow") && result.hudText.includes("Athlete left") && result.hudText.includes("Spatial Grid"), "Flow/Track/Spatial HUD states were incomplete.");
  assert(result.fullscreenDisabledWhenUnsupported === true, "Fullscreen unavailable state did not disable the control.");
  assert(result.fullscreenIntentCount === 2, "Disconnect/reconnect duplicated or lost fullscreen listeners.");
  assert(result.themeToken === "#123456", "Generic theme token override did not project through the playfield host.");
  const search = result.intents.find((intent) => intent.type === "beatsaver-search");
  assert(search?.payload.query === "Forklift", "Search intent omitted its normalized query.");
  const local = result.intents.find((intent) => intent.type === "local-zip-request");
  assert(Boolean(local) && Object.keys(local.payload).length === 0, "Local ZIP intent leaked file or byte payload.");
  assert(result.intents.some((intent) => intent.type === "beatsaver-import"), "Selected-map import intent was missing.");
  assert(result.intents.find((intent) => intent.type === "beatsaver-difficulty-select")?.payload.difficultyId === "Hard", "Difficulty selection intent lost its stable ID.");
  assert(result.intents.find((intent) => intent.type === "content-import-cancel")?.payload.jobId === "job-1", "Import cancellation lost its job ID.");
  assert(result.intents.find((intent) => intent.type === "library-delete")?.payload.packageId === "package-1", "Library deletion lost its package ID.");
  const profile = result.intents.find((intent) => intent.type === "prototype-select");
  assert(profile?.payload.profileId === "spatial-cut", "Profile selection intent lost the stable profile ID.");
  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    unnamedControls: Array.from(document.querySelectorAll("aero-beatsaver-browser, aero-content-library, aero-prototype-selector, aero-fullscreen-button")).flatMap((host) => Array.from(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])).filter((control) => {
      const text = control.textContent?.trim() ?? "";
      const aria = control.getAttribute("aria-label") ?? "";
      const labelled = control.closest("label")?.textContent?.trim() ?? "";
      return text === "" && aria === "" && labelled === "";
    }).length,
    parts: Array.from(document.querySelectorAll("aero-beatsaver-browser, aero-content-library, aero-prototype-selector")).every((host) => host.shadowRoot?.querySelector("[part]"))
  }));
  assert(metrics.bodyWidth <= metrics.viewportWidth, "Product presenters overflowed the 390px viewport.");
  assert(metrics.unnamedControls === 0, "A product presenter exposed an unnamed interactive control.");
  assert(metrics.parts === true, "Stable direct-embed ::part surfaces were not present.");
} finally {
  await browser.close();
  await server.close();
}

if (pageErrors.length || consoleNoise.length) {
  console.error([...pageErrors, ...consoleNoise].join("\n"));
  process.exit(1);
}
console.log(`Product UI Chromium validation passed at ${url}`);

/** @param {boolean} condition @param {string} message @returns {void} */
function assert(condition, message) { if (!condition) throw new Error(message); }
