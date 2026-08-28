// @ts-check

import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
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
  assert(result.checkedProfile.includes("Spatial Grid") && result.checkedProfile.includes("Cut Family"), "Touch/click prototype selection did not expose checked state.");
  assert(result.regenerationText.includes("Regeneration required"), "Converter tuning did not expose regeneration-required telemetry.");
  assert(result.renderSurface === true && result.cellCount === 12, "Grid host did not expose its public surface and 4x3 receptors.");
  assert(result.pauseRole === "alertdialog", "Tracking pause was not exposed as an accessible modal alert.");
  assert(result.countdownText.includes("Workout time frozen"), "Countdown did not announce frozen workout time.");
  assert(result.hudText.includes("Flow") && result.hudText.includes("Athlete left") && result.hudText.includes("Spatial Grid"), "Flow/Track/Spatial HUD states were incomplete.");
  assert(result.fullscreenDisabledWhenUnsupported === true, "Fullscreen unavailable state did not disable the control.");
  assert(result.fullscreenIntentCount === 2, "Disconnect/reconnect duplicated or lost fullscreen listeners.");
  assert(result.fullscreenExitIntentCount === 1, "Active fullscreen did not emit explicit exit intent.");
  assert(result.themeToken === "#123456", "Generic theme token override did not project through the playfield host.");
  const search = result.intents.find((intent) => intent.type === "beatsaver-search");
  assert(search?.payload.query === "Forklift", "Search intent omitted its normalized query.");
  const local = result.intents.find((intent) => intent.type === "local-zip-request");
  assert(Boolean(local) && Object.keys(local.payload).length === 0, "Local ZIP intent leaked file or byte payload.");
  const selectedImport = result.intents.find((intent) => intent.type === "beatsaver-import");
  assert(selectedImport?.payload.mapId === "4858" && selectedImport.payload.versionHash === "a".repeat(40) && selectedImport.payload.difficultyId === "Expert", "Selected-map import intent omitted exact map/version/difficulty IDs.");
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

  const adversarial = await page.evaluate(async () => {
    const captured = [];
    const capture = (event) => { if (event instanceof CustomEvent) captured.push(event.detail); };
    document.addEventListener("aero:ui:intent", capture);

    const selector = document.querySelector("aero-prototype-selector");
    const radios = [...(selector?.shadowRoot?.querySelectorAll("button[role='radio']") ?? [])];
    const selectedRadio = radios.find((radio) => radio.getAttribute("aria-checked") === "true");
    selectedRadio?.focus();
    selectedRadio?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    const radioTabIndexes = radios.map((radio) => radio.tabIndex);
    const arrowProfileId = captured.findLast((intent) => intent?.type === "prototype-select")?.payload?.profileId ?? "";
    const focusedRadioId = selector?.shadowRoot?.activeElement?.dataset?.value ?? "";

    const library = document.createElement("aero-content-library");
    library.setSnapshot({ packages: [{ packageId: "confirm-package", name: "Confirm me", variantCount: 1 }] });
    document.body.append(library);
    library.shadowRoot?.querySelector("button[data-intent='library-delete-request']")?.click();
    const deleteBeforeConfirm = captured.filter((intent) => intent?.type === "library-delete").length;
    const confirmationVisible = Boolean(library.shadowRoot?.querySelector("button[data-intent='library-delete']"));
    library.shadowRoot?.querySelector("button[data-intent='library-delete']")?.click();
    const confirmedDelete = captured.findLast((intent) => intent?.type === "library-delete")?.payload?.packageId ?? "";

    const returnButton = document.createElement("button");
    returnButton.textContent = "Return focus";
    document.body.append(returnButton);
    returnButton.focus();
    const pause = document.createElement("aero-tracking-pause");
    pause.setSnapshot({ active: false });
    document.body.append(pause);
    pause.setSnapshot({ active: true, message: "Tracking lost" });
    await Promise.resolve();
    const pauseFocused = pause.shadowRoot?.activeElement?.getAttribute("data-intent") ?? "";
    pause.setSnapshot({ active: false });
    await Promise.resolve();
    const focusRestored = document.activeElement === returnButton;

    const calibrationScreen = document.createElement("aero-calibration-screen");
    calibrationScreen.style.display = "none";
    document.body.append(calibrationScreen);
    const previewBefore = calibrationScreen.shadowRoot?.querySelector("aero-media-pose-preview");
    const surfaceBefore = calibrationScreen.shadowRoot?.querySelector("aero-grid-playfield")?.getRenderSurface();
    calibrationScreen.setSnapshot({ calibration: { state: "holding", progress: 0.25 } });
    const stablePreview = previewBefore === calibrationScreen.shadowRoot?.querySelector("aero-media-pose-preview");
    const stableSurface = surfaceBefore === calibrationScreen.shadowRoot?.querySelector("aero-grid-playfield")?.getRenderSurface();

    const isolatedBrowser = document.createElement("aero-beatsaver-browser");
    const mutable = { state: "results", results: [{ mapId: "safe", name: "Before mutation", songAuthorName: "Artist" }] };
    isolatedBrowser.setSnapshot(mutable);
    document.body.append(isolatedBrowser);
    mutable.results[0].name = "After mutation";
    isolatedBrowser.remove();
    document.body.append(isolatedBrowser);
    const mutationText = isolatedBrowser.shadowRoot?.textContent ?? "";
    let getterCalls = 0;
    const malicious = { state: "results", results: [{ mapId: "bad\" onfocus=alert(1)", name: "<img src=x onerror=alert(1)>", songAuthorName: "<script>x</script>" }] };
    Object.defineProperty(malicious, "provider", { enumerable: true, get() { getterCalls += 1; return new Blob(["raw"]); } });
    isolatedBrowser.setSnapshot(malicious);
    const injectedElements = isolatedBrowser.shadowRoot?.querySelectorAll("img,script").length ?? -1;

    const storage = document.createElement("aero-content-library");
    document.body.append(storage);
    storage.setSnapshot({ usedBytes: Number.NaN, quotaBytes: Number.NaN });
    const nanStorage = storage.shadowRoot?.querySelector("[part='storage']")?.textContent ?? "";
    storage.setSnapshot({ usedBytes: Number.MAX_VALUE, quotaBytes: Number.MIN_VALUE });
    const hugeStorage = storage.shadowRoot?.querySelector("[part='storage']")?.textContent ?? "";

    const firstFullscreen = document.createElement("aero-fullscreen-button");
    const secondFullscreen = document.createElement("aero-fullscreen-button");
    firstFullscreen.setSnapshot({ supported: true, active: false, requestPending: false, errorCode: null });
    secondFullscreen.setSnapshot({ supported: true, active: true, requestPending: false, errorCode: null });
    document.body.append(firstFullscreen, secondFullscreen);
    firstFullscreen.shadowRoot?.querySelector("button")?.click();
    secondFullscreen.shadowRoot?.querySelector("button")?.click();
    const instanceIntents = captured.slice(-2).map((intent) => intent.type);

    const module = await import("/src/index.js");
    module.defineAeroUiElements();
    module.defineAeroUiElements();
    const idempotentDefinition = customElements.get("aero-prototype-selector") === module.AeroPrototypeSelector;
    const scalarPayloadsOnly = captured.every((intent) => Object.values(intent?.payload ?? {}).every((value) => value === null || ["string", "number", "boolean"].includes(typeof value)));
    document.removeEventListener("aero:ui:intent", capture);
    library.remove();
    returnButton.remove();
    pause.remove();
    calibrationScreen.remove();
    isolatedBrowser.remove();
    storage.remove();
    firstFullscreen.remove();
    secondFullscreen.remove();
    return {
      arrowProfileId,
      focusedRadioId,
      radioTabIndexes,
      deleteBeforeConfirm,
      confirmationVisible,
      confirmedDelete,
      pauseFocused,
      focusRestored,
      stablePreview,
      stableSurface,
      mutationText,
      getterCalls,
      injectedElements,
      nanStorage,
      hugeStorage,
      instanceIntents,
      idempotentDefinition,
      scalarPayloadsOnly
    };
  });
  assert(adversarial.arrowProfileId === "flow" && adversarial.focusedRadioId === "flow", "Arrow-key radio navigation did not wrap, select and focus the adjacent profile.");
  assert(adversarial.radioTabIndexes.filter((value) => value === 0).length === 1, "Prototype radio group did not expose one roving tab stop.");
  assert(adversarial.deleteBeforeConfirm === 0 && adversarial.confirmationVisible && adversarial.confirmedDelete === "confirm-package", "Library deletion did not require explicit confirmation.");
  assert(adversarial.pauseFocused === "calibration-reset" && adversarial.focusRestored, "Tracking alert dialog did not move and restore focus.");
  assert(adversarial.stablePreview && adversarial.stableSurface, "Calibration snapshot replacement destroyed media or renderer attachment surfaces.");
  assert(adversarial.mutationText.includes("Before mutation") && !adversarial.mutationText.includes("After mutation"), "External snapshot mutation changed presenter state after reconnect.");
  assert(adversarial.getterCalls === 0 && adversarial.injectedElements === 0, "Snapshot narrowing executed an accessor or allowed markup injection.");
  assert(adversarial.nanStorage.includes("quota unavailable") && !adversarial.hugeStorage.includes("Infinity") && !adversarial.hugeStorage.includes("-%"), "Storage telemetry exposed invalid numeric output.");
  assert(adversarial.instanceIntents.join(",") === "fullscreen-request,fullscreen-exit", "Multiple fullscreen presenters leaked or conflated instance intent.");
  assert(adversarial.idempotentDefinition && adversarial.scalarPayloadsOnly, "Definition or scalar-only event contracts failed.");

  mkdirSync("screenshots", { recursive: true });
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const layout = await page.evaluate(() => {
      const smallControls = Array.from(document.querySelectorAll("*")).flatMap((host) => Array.from(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])).filter((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.width < 42 || bounds.height < 42;
      }).length;
      const track = document.querySelector("aero-boxing-track-hud");
      const contrast = Array.from(track?.shadowRoot?.querySelectorAll(".lane,.defense") ?? []).map((element) => contrastRatio(getComputedStyle(element).color, getComputedStyle(element).backgroundColor));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        smallControls,
        minimumTrackContrast: contrast.length ? Math.min(...contrast) : 0
      };

      function contrastRatio(foreground, background) {
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
      }
      function luminance(color) {
        const channels = color.match(/[\d.]+/gu)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        const linear = channels.map((channel) => { const value = channel / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      }
    });
    assert(layout.scrollWidth <= layout.clientWidth, `${viewport.name} product presenters overflowed horizontally.`);
    assert(layout.smallControls === 0, `${viewport.name} exposed controls smaller than 42 CSS pixels.`);
    assert(layout.minimumTrackContrast >= 4.5, `${viewport.name} default Track HUD text contrast was below WCAG AA.`);
  }
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    const evidencePage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await evidencePage.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
    await evidencePage.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    await evidencePage.screenshot({ path: `screenshots/task9-ui-${viewport.name}.png`, fullPage: false });
    await evidencePage.close();
  }
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
