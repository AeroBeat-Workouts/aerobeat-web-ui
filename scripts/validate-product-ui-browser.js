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
  assert(result.libraryButtons === 2, "Library Export/Delete action buttons were not rendered independently of package selection radios.");
  assert(result.calibrationProgress === "0.75", "Calibration hold progress was not exposed.");
  for (const state of ["waiting", "holding", "cooldown", "calibrated", "error"]) assert(result.calibrationStateTexts[state].length > 0, `Calibration ${state} state was not announced.`);
  assert(result.capabilityLabels === 8, "Capability availability was incomplete.");
  assert(result.profileCount === 5, "Flow plus four Boxing profile choices were not rendered.");
  assert(result.checkedProfile.includes("Spatial Grid") && result.checkedProfile.includes("Cut Family"), "Touch/click prototype selection did not expose checked state.");
  assert(result.regenerationText.includes("Regeneration required"), "Converter tuning did not expose regeneration-required telemetry.");
  assert(result.managedProfileClasses === 3, "Visual, scoring, and converter profile classes were not all rendered.");
  assert(result.deterministicProfileState === "live_visual,between_run_ruleset,converter_regeneration|true", "Host-readable profile state was not immutable and canonical.");
  assert(result.scoringDisabled === true && result.scoringStatus.includes("Pause or finish"), "Playing-state scoring selection was not disabled with a reason.");
  assert(result.converterStatus.includes("e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea") && result.converterStatus.includes("a43b53a39c13c9e9efe59854aee0fa16efdcd3c6a29bc09f678d94b3fd8f0202"), "Converter selected/applied/pending truth was incomplete.");
  assert(result.renderSurface === true && result.cellCount === 12, "Grid host did not expose its public surface and 4x3 receptors.");
  assert(result.pauseRole === "alertdialog", "Tracking pause was not exposed as an accessible modal alert.");
  assert(result.countdownText.includes("Workout time frozen"), "Countdown did not announce frozen workout time.");
  assert(result.hudText.includes("Flow") && result.hudText.includes("Athlete left") && result.hudText.includes("Spatial Grid"), "Flow/Track/Spatial HUD states were incomplete.");
  assert(result.sessionMissingState.disabled === true && result.sessionMissingState.prerequisite === "Download Music first." && result.disabledSessionIntentCount === 0, "Missing downloaded Music did not truthfully gate Start/Test with a minimal prerequisite.");
  assert(result.sessionPendingState.disabled === true && result.sessionPendingState.active === "Test" && result.sessionPendingState.busy === "Test", "Pending/active Test action truth was not exposed.");
  assert(JSON.stringify(result.sessionReadyButtons) === JSON.stringify([{ text: "Start", disabled: false, current: "true" }, { text: "Test", disabled: false, current: "false" }]), "Ready Start/Test labels, enablement, or active truth changed.");
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
  const visualProfile = result.intents.find((intent) => intent.type === "prototype-profile-select");
  assert(visualProfile?.payload.profileClass === "live_visual" && visualProfile.payload.profileId === "aero.visual.compact" && visualProfile.payload.profileVersion === "1.0.0" && visualProfile.payload.contentHash === "e65d53dfaafe8a859c08837acb3d447b10b03508bd5ae64677d273c93657d603", "Visual profile intent omitted bounded scalar identity fields.");
  for (const type of ["tuning-import-request", "tuning-export", "tuning-reset", "session-start", "session-test"]) assert(Object.keys(result.intents.find((intent) => intent.type === type)?.payload ?? {}).length === 0, `${type} leaked non-scalar or host-owned data.`);
  for (const intent of result.intents) for (const value of Object.values(intent.payload)) assert(value === null || ["string", "number", "boolean"].includes(typeof value), `${intent.type} emitted a non-scalar payload value.`);
  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    unnamedControls: Array.from(document.querySelectorAll("aero-beatsaver-browser, aero-content-library, aero-prototype-selector, aero-session-actions, aero-fullscreen-button")).flatMap((host) => Array.from(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])).filter((control) => {
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
  const scoringEnablement = await page.evaluate(() => {
    const selector = document.querySelector("aero-prototype-selector");
    if (!selector || typeof selector.setSnapshot !== "function") return false;
    selector.setSnapshot({ ...selector.presenterSnapshot, selectedProfileId: "spatial-cut", sessionState: "paused_manual" });
    const enabled = !selector.shadowRoot?.querySelector("article[data-profile-class='between_run_ruleset'] button")?.hasAttribute("disabled");
    selector.setSnapshot({ ...selector.presenterSnapshot, sessionState: "countdown" });
    const countdownLocked = selector.shadowRoot?.querySelector("article[data-profile-class='between_run_ruleset'] button")?.hasAttribute("disabled") === true;
    return enabled && countdownLocked;
  });
  assert(scoringEnablement === true, "Scoring selection did not enable while paused and lock during countdown.");

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
    const hostileSelector = document.createElement("aero-prototype-selector");
    hostileSelector.setSnapshot(selector.presenterSnapshot);
    document.body.append(hostileSelector);
    const canonicalDirectAccepted = hostileSelector.getProfilePresenterState().profileClasses.length === 3 && hostileSelector.shadowRoot?.textContent?.includes("aero.visual.default");
    const priorProfileState = JSON.stringify(hostileSelector.getProfilePresenterState());
    const attackResults = [];
    const attack = (candidate) => { hostileSelector.setSnapshot(candidate); attackResults.push(JSON.stringify(hostileSelector.getProfilePresenterState()) === priorProfileState); };
    let candidate = structuredClone(selector.presenterSnapshot);
    delete candidate.profileClasses[0].active.schema;
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active.extra = true;
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    Object.defineProperty(candidate.profileClasses[0].active, "hidden", { value: true });
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active[Symbol("extra")] = true;
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    Object.defineProperty(candidate.profileClasses[0].active, "contentHash", { enumerable: true, get() { getterCalls += 1; return "f".repeat(64); } });
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    Object.defineProperty(candidate.profileClasses[0], "active", { enumerable: true, get() { getterCalls += 1; return {}; } });
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active = new (class Identity {})();
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active = new Uint8Array(7);
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active.profileId = "x".repeat(257);
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active.contentHash = "F".repeat(64);
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[0].active.regenerationRequired = true;
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[1].active.regenerationRequired = true;
    attack(candidate);
    candidate = structuredClone(selector.presenterSnapshot);
    candidate.profileClasses[2].regenerationRequired = false;
    attack(candidate);
    const hostileIdentityRejected = attackResults.every(Boolean) && attackResults.length === 13;
    const hostileBoundsRejected = hostileIdentityRejected;
    const lifecycleSelector = document.createElement("aero-prototype-selector");
    document.body.append(lifecycleSelector);
    const detachedReset = lifecycleSelector.shadowRoot?.querySelector("button[data-intent='tuning-reset']");
    lifecycleSelector.remove();
    const beforeDetachedClick = captured.filter((intent) => intent.type === "tuning-reset").length;
    detachedReset?.click();
    document.body.append(lifecycleSelector);
    lifecycleSelector.shadowRoot?.querySelector("button[data-intent='tuning-reset']")?.click();
    const lifecycleResetCount = captured.filter((intent) => intent.type === "tuning-reset").length - beforeDetachedClick;

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

    const defaultSelector = document.createElement("aero-prototype-selector");
    const defaultSelectorTwin = document.createElement("aero-prototype-selector");
    defaultSelector.setSnapshot(selector.presenterSnapshot);
    defaultSelectorTwin.setSnapshot(selector.presenterSnapshot);
    document.body.append(defaultSelector, defaultSelectorTwin);
    const defaultFullMarkupUnchanged = defaultSelector.shadowRoot?.innerHTML === defaultSelectorTwin.shadowRoot?.innerHTML && defaultSelector.scope === "full" && defaultSelector.shadowRoot?.querySelectorAll("input[type='radio']").length === 0 && defaultSelector.shadowRoot?.querySelectorAll("button[role='radio']").length === 5 && defaultSelector.getProfilePresenterState().profileClasses.length === 3;
    const gameplaySelector = document.createElement("aero-prototype-selector");
    gameplaySelector.scope = "gameplay";
    gameplaySelector.setSnapshot({ selectedProfileId: "spatial-row", sessionState: "playing" });
    const visualsSelector = document.createElement("aero-prototype-selector");
    visualsSelector.setAttribute("scope", "visuals");
    visualsSelector.setSnapshot(selector.presenterSnapshot);
    document.body.append(gameplaySelector, visualsSelector);
    const gameplayLabels = [...(gameplaySelector.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? "");
    const gameplayGroupLabels = [...(gameplaySelector.shadowRoot?.querySelectorAll("fieldset") ?? [])].map((group) => [...group.querySelectorAll("label span")].map((label) => label.textContent ?? ""));
    const visualLabels = [...(visualsSelector.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? "");
    const gameplayChecked = gameplaySelector.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? 0;
    const visualChecked = visualsSelector.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? 0;
    const gameplaySelected = gameplaySelector.shadowRoot?.querySelector("input[name='gameplay-mode-choice']:checked")?.value ?? "";
    const conversionSelected = gameplaySelector.shadowRoot?.querySelector("input[name='boxing-conversion-choice']:checked")?.value ?? "";
    const visualSelected = visualsSelector.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const exactVariantMatrix = ["flow", "semantic-row", "spatial-row", "semantic-cut", "spatial-cut"].map((selectedProfileId) => {
      const candidate = document.createElement("aero-prototype-selector");
      candidate.scope = "gameplay";
      candidate.setSnapshot({ selectedProfileId, sessionState: "idle" });
      document.body.append(candidate);
      const result = [selectedProfileId, candidate.shadowRoot?.querySelector("input[name='gameplay-mode-choice']:checked")?.value ?? "", candidate.shadowRoot?.querySelector("input[name='boxing-conversion-choice']:checked")?.value ?? "", String(candidate.shadowRoot?.querySelectorAll("input:checked").length ?? 0)].join(":");
      candidate.remove();
      return result;
    });
    gameplaySelector.shadowRoot?.querySelector("input[value='boxing_semantic_track_v1']")?.click();
    gameplaySelector.shadowRoot?.querySelector("input[value='cut_family_source_height_v1']")?.click();
    const scopedModeIntent = captured.findLast((intent) => intent?.type === "gameplay-mode-select")?.payload;
    const scopedConversionIntent = captured.findLast((intent) => intent?.type === "boxing-conversion-select")?.payload;
    const scopedText = `${gameplaySelector.shadowRoot?.querySelector("section")?.textContent ?? ""} ${visualsSelector.shadowRoot?.querySelector("section")?.textContent ?? ""}`;
    const nativeRadioVisibility = [...(gameplaySelector.shadowRoot?.querySelectorAll("input[type='radio']") ?? []), ...(visualsSelector.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])].every((radio) => {
      const style = getComputedStyle(radio);
      const bounds = radio.getBoundingClientRect();
      return style.display !== "none" && style.visibility === "visible" && Number(style.opacity) === 1 && style.appearance !== "none" && bounds.width >= 42 && bounds.height >= 42;
    });
    visualsSelector.shadowRoot?.querySelector("input[value='aero.visual.compact']")?.click();
    const scopedVisualIntent = captured.findLast((intent) => intent?.type === "prototype-profile-select")?.payload;
    const gameplayFallback = document.createElement("aero-prototype-selector");
    gameplayFallback.scope = "gameplay";
    gameplayFallback.setSnapshot({ selectedProfileId: "not-a-profile", sessionState: "idle" });
    document.body.append(gameplayFallback);
    const gameplayFallbackId = gameplayFallback.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const gameplayFallbackChecked = gameplayFallback.shadowRoot?.querySelectorAll("input:checked").length ?? 0;
    const visualFallback = document.createElement("aero-prototype-selector");
    visualFallback.scope = "visuals";
    const leaderlessSnapshot = structuredClone(selector.presenterSnapshot);
    leaderlessSnapshot.profileClasses[0].active = { ...leaderlessSnapshot.profileClasses[0].active, profileId: "aero.visual.missing", contentHash: "c".repeat(64) };
    visualFallback.setSnapshot(leaderlessSnapshot);
    document.body.append(visualFallback);
    const visualFallbackId = visualFallback.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const scopedBeforeAttack = visualFallback.shadowRoot?.innerHTML ?? "";
    leaderlessSnapshot.profileClasses[0].active.schema = "malicious/schema";
    visualFallback.setSnapshot(leaderlessSnapshot);
    const scopedAtomicRejection = visualFallback.shadowRoot?.innerHTML === scopedBeforeAttack;
    const detachedScopedInput = gameplayFallback.shadowRoot?.querySelector("input[value='boxing_semantic_track_v1']");
    gameplayFallback.remove();
    const beforeDetachedScoped = captured.filter((intent) => intent.type === "gameplay-mode-select").length;
    detachedScopedInput?.click();
    document.body.append(gameplayFallback);
    gameplayFallback.shadowRoot?.querySelector("input[value='boxing_semantic_track_v1']")?.click();
    const scopedReconnectIntentCount = captured.filter((intent) => intent.type === "gameplay-mode-select").length - beforeDetachedScoped;

    const mapSnapshot = (selectedMapId) => ({ state: "results", results: [{ mapId: "map-alpha", name: "Alpha Song", songAuthorName: "Alpha Artist" }, { mapId: "map-beta", name: "Beta Song", songAuthorName: "Beta Artist" }], selectedMap: { mapId: selectedMapId, name: "Selected Song", songAuthorName: "Artist", levelAuthorName: "Mapper" }, versions: [{ versionHash: "a".repeat(40), label: "Current" }], difficulties: ["Hard"], selectedVersionHash: "a".repeat(40), selectedDifficulty: "Hard" });
    const currentMapBrowser = document.createElement("aero-beatsaver-browser");
    const fallbackMapBrowser = document.createElement("aero-beatsaver-browser");
    const emptyMapBrowser = document.createElement("aero-beatsaver-browser");
    currentMapBrowser.setSnapshot(mapSnapshot("map-beta"));
    fallbackMapBrowser.setSnapshot(mapSnapshot("map-missing"));
    emptyMapBrowser.setSnapshot({ state: "empty", results: [] });
    document.body.append(currentMapBrowser, fallbackMapBrowser, emptyMapBrowser);
    const currentMapChecked = currentMapBrowser.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const fallbackMapChecked = fallbackMapBrowser.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const mapCheckedCounts = [currentMapBrowser, fallbackMapBrowser, emptyMapBrowser].map((host) => host.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? -1);
    const mapActionButtons = [...(currentMapBrowser.shadowRoot?.querySelectorAll("button") ?? [])];
    const mapSelects = [...(currentMapBrowser.shadowRoot?.querySelectorAll("select") ?? [])];
    const beforeMapSelect = captured.filter((intent) => intent.type === "beatsaver-select-map").length;
    const alphaMapRadio = currentMapBrowser.shadowRoot?.querySelector("input[value='map-alpha']");
    alphaMapRadio?.focus();
    alphaMapRadio?.click();
    currentMapBrowser.setSnapshot(mapSnapshot("map-alpha"));
    const mapFocusPreserved = currentMapBrowser.shadowRoot?.activeElement?.value === "map-alpha";
    const mapSelectIntents = captured.filter((intent) => intent.type === "beatsaver-select-map").slice(beforeMapSelect);
    const detachedMapRadio = currentMapBrowser.shadowRoot?.querySelector("input[value='map-beta']");
    currentMapBrowser.remove();
    const beforeMapReconnect = captured.filter((intent) => intent.type === "beatsaver-select-map").length;
    detachedMapRadio?.click();
    document.body.append(currentMapBrowser);
    currentMapBrowser.shadowRoot?.querySelector("input[value='map-beta']")?.click();
    const mapReconnectIntentCount = captured.filter((intent) => intent.type === "beatsaver-select-map").length - beforeMapReconnect;

    const packageSnapshot = (selectedPackageId) => ({ selectedPackageId, packages: [{ packageId: "package-alpha", name: "Alpha Package", variantCount: 2 }, { packageId: "package-beta", name: "Beta Package", variantCount: 3 }], usedBytes: 1024, quotaBytes: 4096 });
    const currentLibrary = document.createElement("aero-content-library");
    const fallbackLibrary = document.createElement("aero-content-library");
    const emptyLibrary = document.createElement("aero-content-library");
    currentLibrary.setSnapshot(packageSnapshot("package-beta"));
    fallbackLibrary.setSnapshot(packageSnapshot("package-missing"));
    emptyLibrary.setSnapshot({ selectedPackageId: "package-missing", packages: [] });
    document.body.append(currentLibrary, fallbackLibrary, emptyLibrary);
    const currentPackageChecked = currentLibrary.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const fallbackPackageChecked = fallbackLibrary.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const packageCheckedCounts = [currentLibrary, fallbackLibrary, emptyLibrary].map((host) => host.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? -1);
    const libraryActionButtons = [...(currentLibrary.shadowRoot?.querySelectorAll("button") ?? [])];
    const beforeLibrarySelect = captured.filter((intent) => intent.type === "library-select").length;
    const alphaPackageRadio = currentLibrary.shadowRoot?.querySelector("input[value='package-alpha']");
    alphaPackageRadio?.focus();
    alphaPackageRadio?.click();
    currentLibrary.setSnapshot(packageSnapshot("package-alpha"));
    const libraryFocusPreserved = currentLibrary.shadowRoot?.activeElement?.value === "package-alpha";
    const librarySelectIntents = captured.filter((intent) => intent.type === "library-select").slice(beforeLibrarySelect);
    const musicInstancesIndependent = fallbackMapBrowser.shadowRoot?.querySelector("input:checked")?.value === "map-alpha" && fallbackLibrary.shadowRoot?.querySelector("input:checked")?.value === "package-alpha";
    const musicRadiosVisible = [currentMapBrowser, fallbackMapBrowser, currentLibrary, fallbackLibrary].flatMap((host) => [...(host.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])]).every((radio) => { const style = getComputedStyle(radio); const bounds = radio.getBoundingClientRect(); return style.appearance !== "none" && style.visibility === "visible" && bounds.width >= 42 && bounds.height >= 42; });

    const module = await import("/src/index.js");
    module.defineAeroUiElements();
    module.defineAeroUiElements();
    const idempotentDefinition = customElements.get("aero-prototype-selector") === module.AeroPrototypeSelector;
    const scalarPayloadsOnly = captured.every((intent) => Object.values(intent?.payload ?? {}).every((value) => value === null || ["string", "number", "boolean"].includes(typeof value)));

    isolatedBrowser.setSnapshot({ state: "results", query: "Papercut", results: [{ mapId: "4858", name: "Papercut", songAuthorName: "Linkin Park" }], selectedMap: { mapId: "4858", name: "Papercut", songAuthorName: "Linkin Park", levelAuthorName: "Mapper" }, versions: [{ versionHash: "a".repeat(40), label: "Current version" }], difficulties: ["Hard", "Expert"], selectedVersionHash: "a".repeat(40), selectedDifficulty: "Expert" });
    const compactError = document.createElement("aero-error-panel");
    compactError.setSnapshot({ code: "camera_permission_denied", message: "Camera permission is required.", retryable: true });
    document.body.append(compactError);
    const compactCalibration = document.querySelector("aero-calibration-badge");
    const compactCapabilities = document.querySelector("aero-capabilities-panel");
    if (!(compactCalibration instanceof HTMLElement) || !(compactCapabilities instanceof HTMLElement)) throw new Error("Compact fixture presenters are missing.");
    const compactHosts = [isolatedBrowser, storage, compactCalibration, compactCapabilities, hostileSelector, firstFullscreen, compactError];
    const defaultMarkup = compactHosts.map((host) => host.shadowRoot?.innerHTML ?? "");
    const beforeCompactIntents = captured.length;
    for (const host of compactHosts) Reflect.set(host, "compact", true);
    const compactAttributeRoundtrip = compactHosts.every((host) => host.hasAttribute("compact") && Reflect.get(host, "compact") === true);
    const compactHeadingsSuppressed = compactHosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("h1,h2,h3,.compact-converter-truth") ?? [])]).every((heading) => {
      const style = getComputedStyle(heading);
      const bounds = heading.getBoundingClientRect();
      return style.position === "absolute" && bounds.width <= 1 && bounds.height <= 1;
    });
    const compactMetadataSuppressed = compactHosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll(".compact-identity,.compact-telemetry,.muted:not(.live):not(.compact-critical):not(.compact-converter-truth),.pill:not(.error)") ?? [])]).every((entry) => getComputedStyle(entry).display === "none");
    const compactControls = compactHosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])]);
    const compactControlsActionable = compactControls.every((control) => {
      const bounds = control.getBoundingClientRect();
      return getComputedStyle(control).display !== "none" && bounds.width >= 42 && bounds.height >= 42;
    });
    const compactAccessibleFields = isolatedBrowser.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Search maps" && isolatedBrowser.shadowRoot?.querySelector("output")?.getAttribute("aria-label") === "Version" && isolatedBrowser.shadowRoot?.querySelector("select") === null;
    const compactCriticalVisible = getComputedStyle(compactCalibration.shadowRoot?.querySelector("[role='status']")).display !== "none" && getComputedStyle(hostileSelector.shadowRoot?.querySelector(".pill.error")).display !== "none" && getComputedStyle(compactError.shadowRoot?.querySelector(".error")).display !== "none";
    const styleSignature = (button) => { const style = getComputedStyle(button); return `${style.backgroundImage}|${style.borderColor}|${style.boxShadow}|${style.color}`; };
    const selectedGameplay = hostileSelector.shadowRoot?.querySelector("button[role='radio'][aria-checked='true']");
    const unselectedGameplay = hostileSelector.shadowRoot?.querySelector("button[role='radio'][aria-checked='false']");
    const compactGameplaySelectionVisible = selectedGameplay instanceof HTMLButtonElement && unselectedGameplay instanceof HTMLButtonElement && styleSignature(selectedGameplay) !== styleSignature(unselectedGameplay);
    const profileGroups = [...(hostileSelector.shadowRoot?.querySelectorAll("article[data-profile-class]") ?? [])].map((article) => [...article.querySelectorAll("button[data-intent='prototype-profile-select']")]);
    const compactProfileSelectionVisible = profileGroups.every((buttons) => buttons.filter((button) => button.getAttribute("aria-pressed") === "true").length === 1 && (buttons.length < 2 || styleSignature(buttons.find((button) => button.getAttribute("aria-pressed") === "true")) !== styleSignature(buttons.find((button) => button.getAttribute("aria-pressed") === "false"))));
    for (const host of compactHosts) Reflect.set(host, "compact", false);
    const compactDefaultRestored = compactHosts.every((host, index) => !host.hasAttribute("compact") && (host.shadowRoot?.innerHTML ?? "") === defaultMarkup[index]);
    const compactToggleIntentFree = captured.length === beforeCompactIntents;
    document.removeEventListener("aero:ui:intent", capture);
    library.remove();
    returnButton.remove();
    pause.remove();
    calibrationScreen.remove();
    isolatedBrowser.remove();
    hostileSelector.remove();
    lifecycleSelector.remove();
    storage.remove();
    firstFullscreen.remove();
    secondFullscreen.remove();
    defaultSelector.remove();
    defaultSelectorTwin.remove();
    gameplaySelector.remove();
    visualsSelector.remove();
    gameplayFallback.remove();
    visualFallback.remove();
    currentMapBrowser.remove();
    fallbackMapBrowser.remove();
    emptyMapBrowser.remove();
    currentLibrary.remove();
    fallbackLibrary.remove();
    emptyLibrary.remove();
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
      canonicalDirectAccepted,
      hostileIdentityRejected,
      hostileBoundsRejected,
      lifecycleResetCount,
      nanStorage,
      hugeStorage,
      instanceIntents,
      defaultFullMarkupUnchanged,
      gameplayLabels,
      gameplayGroupLabels,
      visualLabels,
      gameplayChecked,
      visualChecked,
      gameplaySelected,
      conversionSelected,
      visualSelected,
      exactVariantMatrix,
      scopedModeIntent,
      scopedConversionIntent,
      scopedText,
      nativeRadioVisibility,
      scopedVisualIntent,
      gameplayFallbackId,
      gameplayFallbackChecked,
      visualFallbackId,
      scopedAtomicRejection,
      scopedReconnectIntentCount,
      currentMapChecked,
      fallbackMapChecked,
      mapCheckedCounts,
      mapActionButtonTypes: mapActionButtons.map((button) => button.type),
      mapActionIntents: mapActionButtons.map((button) => button.dataset.intent ?? "search-submit"),
      mapSelectCount: mapSelects.length,
      mapSelectTags: mapSelects.map((select) => select.tagName),
      mapFocusPreserved,
      mapSelectIntents,
      mapReconnectIntentCount,
      currentPackageChecked,
      fallbackPackageChecked,
      packageCheckedCounts,
      libraryActionButtonTypes: libraryActionButtons.map((button) => button.type),
      libraryActionIntents: libraryActionButtons.map((button) => button.dataset.intent ?? ""),
      libraryFocusPreserved,
      librarySelectIntents,
      musicInstancesIndependent,
      musicRadiosVisible,
      idempotentDefinition,
      scalarPayloadsOnly,
      compactAttributeRoundtrip,
      compactHeadingsSuppressed,
      compactMetadataSuppressed,
      compactControlsActionable,
      compactAccessibleFields,
      compactCriticalVisible,
      compactGameplaySelectionVisible,
      compactProfileSelectionVisible,
      compactDefaultRestored,
      compactToggleIntentFree
    };
  });
  await page.evaluate(() => {
    const scoped = document.createElement("aero-prototype-selector");
    scoped.id = "scoped-keyboard-test";
    scoped.setAttribute("scope", "gameplay");
    scoped.setSnapshot({ selectedProfileId: "spatial-row", sessionState: "idle" });
    const after = document.createElement("button");
    after.id = "after-scoped-keyboard-test";
    after.textContent = "After selector";
    document.body.append(scoped, after);
    scoped.shadowRoot?.querySelector("input:checked")?.focus();
  });
  await page.keyboard.press("ArrowRight");
  const scopedArrow = await page.evaluate(() => {
    const scoped = document.querySelector("#scoped-keyboard-test");
    return { checked: scoped?.shadowRoot?.querySelector("input:checked")?.value ?? "", focused: scoped?.shadowRoot?.activeElement?.value ?? "" };
  });
  await page.keyboard.press("Tab");
  const scopedConversionTab = await page.evaluate(() => { const scoped = document.querySelector("#scoped-keyboard-test"); return scoped?.shadowRoot?.activeElement?.value ?? ""; });
  await page.keyboard.press("Tab");
  const scopedTabExited = await page.evaluate(() => document.activeElement?.id === "after-scoped-keyboard-test");
  await page.keyboard.press("Shift+Tab");
  const scopedTabReturned = await page.evaluate(() => {
    const scoped = document.querySelector("#scoped-keyboard-test");
    const returned = scoped?.shadowRoot?.activeElement?.value ?? "";
    scoped?.remove();
    document.querySelector("#after-scoped-keyboard-test")?.remove();
    return returned;
  });
  assert(scopedArrow.checked === "flow_grid_v1" && scopedArrow.focused === "flow_grid_v1" && scopedConversionTab === "row_family_balanced_height_v1" && scopedTabExited && scopedTabReturned === "row_family_balanced_height_v1", "Scoped native radio Arrow/Tab keyboard behavior failed.");
  await page.evaluate(() => {
    const browser = document.createElement("aero-beatsaver-browser");
    browser.id = "music-map-keyboard-test";
    browser.setSnapshot({ state: "results", results: [{ mapId: "alpha", name: "Alpha", songAuthorName: "Artist" }, { mapId: "beta", name: "Beta", songAuthorName: "Artist" }], selectedMap: { mapId: "alpha", name: "Alpha", songAuthorName: "Artist", levelAuthorName: "Mapper" }, versions: [{ versionHash: "a".repeat(40), label: "Current" }], difficulties: ["Hard"], selectedVersionHash: "a".repeat(40), selectedDifficulty: "Hard" });
    document.body.append(browser);
    browser.shadowRoot?.querySelector("input:checked")?.focus();
  });
  await page.keyboard.press("ArrowRight");
  const mapKeyboardArrow = await page.evaluate(() => { const host = document.querySelector("#music-map-keyboard-test"); return { checked: host?.shadowRoot?.querySelector("input:checked")?.value ?? "", focused: host?.shadowRoot?.activeElement?.value ?? "" }; });
  await page.keyboard.press("Tab");
  const mapKeyboardTab = await page.evaluate(() => { const host = document.querySelector("#music-map-keyboard-test"); const intent = host?.shadowRoot?.activeElement?.dataset?.intent ?? ""; host?.remove(); return intent; });
  await page.evaluate(() => {
    const library = document.createElement("aero-content-library");
    library.id = "music-library-keyboard-test";
    library.setSnapshot({ selectedPackageId: "alpha", packages: [{ packageId: "alpha", name: "Alpha", variantCount: 1 }, { packageId: "beta", name: "Beta", variantCount: 1 }] });
    document.body.append(library);
    library.shadowRoot?.querySelector("input:checked")?.focus();
  });
  await page.keyboard.press("ArrowRight");
  const libraryKeyboardArrow = await page.evaluate(() => { const host = document.querySelector("#music-library-keyboard-test"); return { checked: host?.shadowRoot?.querySelector("input:checked")?.value ?? "", focused: host?.shadowRoot?.activeElement?.value ?? "" }; });
  await page.keyboard.press("Tab");
  const libraryKeyboardTab = await page.evaluate(() => { const host = document.querySelector("#music-library-keyboard-test"); const intent = host?.shadowRoot?.activeElement?.dataset?.intent ?? ""; const value = host?.shadowRoot?.activeElement?.dataset?.value ?? ""; host?.remove(); return { intent, value }; });
  assert(mapKeyboardArrow.checked === "beta" && mapKeyboardArrow.focused === "beta" && mapKeyboardTab === "beatsaver-version-select" && libraryKeyboardArrow.checked === "beta" && libraryKeyboardArrow.focused === "beta" && libraryKeyboardTab.intent === "library-export" && libraryKeyboardTab.value === "beta", "Music native radio Arrow/Tab keyboard behavior failed.");
  assert(adversarial.arrowProfileId === "flow" && adversarial.focusedRadioId === "flow", "Arrow-key radio navigation did not wrap, select and focus the adjacent profile.");
  assert(adversarial.radioTabIndexes.filter((value) => value === 0).length === 1, "Prototype radio group did not expose one roving tab stop.");
  assert(adversarial.deleteBeforeConfirm === 0 && adversarial.confirmationVisible && adversarial.confirmedDelete === "confirm-package", "Library deletion did not require explicit confirmation.");
  assert(adversarial.pauseFocused === "calibration-reset" && adversarial.focusRestored, "Tracking alert dialog did not move and restore focus.");
  assert(adversarial.stablePreview && adversarial.stableSurface, "Calibration snapshot replacement destroyed media or renderer attachment surfaces.");
  assert(adversarial.mutationText.includes("Before mutation") && !adversarial.mutationText.includes("After mutation"), "External snapshot mutation changed presenter state after reconnect.");
  assert(adversarial.canonicalDirectAccepted && adversarial.getterCalls === 0 && adversarial.injectedElements === 0 && adversarial.hostileIdentityRejected && adversarial.hostileBoundsRejected, "Canonical identity acceptance or atomic zero-getter hostile rejection failed.");
  assert(adversarial.lifecycleResetCount === 1, "Profile selector disconnect/reconnect duplicated listeners or emitted while detached.");
  assert(adversarial.nanStorage.includes("quota unavailable") && !adversarial.hugeStorage.includes("Infinity") && !adversarial.hugeStorage.includes("-%"), "Storage telemetry exposed invalid numeric output.");
  assert(adversarial.instanceIntents.join(",") === "fullscreen-request,fullscreen-exit", "Multiple fullscreen presenters leaked or conflated instance intent.");
  assert(adversarial.defaultFullMarkupUnchanged, "Omitting scope did not preserve the full development presenter field-for-field.");
  assert(adversarial.gameplayLabels.join("|") === "Flow|Boxing Lanes|Boxing Grid|Balanced Height|Source Height" && JSON.stringify(adversarial.gameplayGroupLabels) === JSON.stringify([["Flow", "Boxing Lanes", "Boxing Grid"], ["Balanced Height", "Source Height"]]) && adversarial.visualLabels.join("|") === "Default|Compact", "Scoped selectors exposed incorrect product labels or groups.");
  assert(adversarial.gameplayChecked === 2 && adversarial.visualChecked === 1 && adversarial.gameplaySelected === "boxing_spatial_grid_v1" && adversarial.conversionSelected === "row_family_balanced_height_v1" && adversarial.visualSelected === "aero.visual.default", "Scoped selectors did not derive exact mode and conversion selections.");
  assert(adversarial.exactVariantMatrix.join("|") === "flow:flow_grid_v1::1|semantic-row:boxing_semantic_track_v1:row_family_balanced_height_v1:2|spatial-row:boxing_spatial_grid_v1:row_family_balanced_height_v1:2|semantic-cut:boxing_semantic_track_v1:cut_family_source_height_v1:2|spatial-cut:boxing_spatial_grid_v1:cut_family_source_height_v1:2", `Exact variant derivation failed: ${adversarial.exactVariantMatrix.join("|")}`);
  assert(adversarial.scopedModeIntent?.rulesetId === "boxing_semantic_track_v1" && Object.keys(adversarial.scopedModeIntent ?? {}).length === 1 && adversarial.scopedConversionIntent?.recipeId === "cut_family_source_height_v1" && Object.keys(adversarial.scopedConversionIntent ?? {}).length === 1, "Scoped Gameplay intents changed their bounded scalar contract.");
  assert(!/(schema|ruleset|recipe|hash|profile|scoring|converter|regeneration|bundle|experimental)/iu.test(adversarial.scopedText), `Scoped selectors exposed development text: ${adversarial.scopedText}`);
  assert(adversarial.nativeRadioVisibility, "Scoped product radios were not visibly native, computed, touch-sized radio inputs.");
  assert(adversarial.scopedVisualIntent?.profileClass === "live_visual" && adversarial.scopedVisualIntent.profileId === "aero.visual.compact" && adversarial.scopedVisualIntent.profileVersion === "1.0.0" && adversarial.scopedVisualIntent.contentHash === "e65d53dfaafe8a859c08837acb3d447b10b03508bd5ae64677d273c93657d603", "Scoped Visuals changed the scalar profile-selection intent.");
  assert(adversarial.gameplayFallbackId === "flow_grid_v1" && adversarial.gameplayFallbackChecked === 1 && adversarial.visualFallbackId === "aero.visual.default", "Scoped selector first-option fallbacks were not deterministic.");
  assert(adversarial.scopedAtomicRejection && adversarial.scopedReconnectIntentCount === 1, `Scoped selector atomicity or reconnect listener exactness regressed: ${JSON.stringify({ atomic: adversarial.scopedAtomicRejection, reconnectIntents: adversarial.scopedReconnectIntentCount })}`);
  assert(adversarial.currentMapChecked === "map-beta" && adversarial.fallbackMapChecked === "map-alpha" && adversarial.mapCheckedCounts.join(",") === "1,1,0", "BeatSaver radios did not preserve current selection, first fallback, and empty truth.");
  assert(adversarial.currentPackageChecked === "package-beta" && adversarial.fallbackPackageChecked === "package-alpha" && adversarial.packageCheckedCounts.join(",") === "1,1,0", "Library radios did not preserve current selection, first fallback, and empty truth.");
  assert(adversarial.mapActionButtonTypes.join(",") === "submit,button,button,button" && adversarial.mapActionIntents.join(",") === "search-submit,beatsaver-latest,local-zip-request,beatsaver-import", "BeatSaver actions no longer remain buttons.");
  assert(adversarial.mapSelectCount === 2 && adversarial.mapSelectTags.every((tag) => tag === "SELECT"), "BeatSaver Version/Difficulty no longer remain native selects.");
  assert(adversarial.libraryActionButtonTypes.every((type) => type === "button") && adversarial.libraryActionIntents.join(",") === "library-export,library-delete-request,library-export,library-delete-request", "Library Export/Delete actions no longer remain buttons.");
  assert(adversarial.mapSelectIntents.length === 1 && adversarial.mapSelectIntents[0].payload.mapId === "map-alpha" && adversarial.librarySelectIntents.length === 1 && adversarial.librarySelectIntents[0].payload.packageId === "package-alpha", "Music radio intents changed scalar IDs or emitted more than once.");
  assert(adversarial.mapFocusPreserved && adversarial.libraryFocusPreserved && adversarial.mapReconnectIntentCount === 1 && adversarial.musicInstancesIndependent, "Music selection focus, reconnect, or multi-instance isolation regressed.");
  assert(adversarial.musicRadiosVisible, "Music choices were not visibly native 42px radio inputs.");
  assert(adversarial.idempotentDefinition && adversarial.scalarPayloadsOnly, "Definition or scalar-only event contracts failed.");
  assert(adversarial.compactAttributeRoundtrip && adversarial.compactHeadingsSuppressed && adversarial.compactMetadataSuppressed, "Compact property/attribute did not visually suppress only designated headings and metadata.");
  assert(adversarial.compactControlsActionable, "Compact mode hid or undersized an actionable control.");
  assert(adversarial.compactAccessibleFields, "Compact mode removed an accessible field name.");
  assert(adversarial.compactCriticalVisible, "Compact mode hid critical live state.");
  assert(adversarial.compactGameplaySelectionVisible && adversarial.compactProfileSelectionVisible, "Compact mode did not expose distinct visual and ARIA selected truth for gameplay/profile choices.");
  assert(adversarial.compactDefaultRestored && adversarial.compactToggleIntentFree, "Compact toggling changed default DOM/state or emitted an intent.");

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
    const evidenceBounds = await evidencePage.evaluate(() => {
      const app = document.querySelector("#app");
      const selector = document.querySelector("aero-prototype-selector");
      if (!(app instanceof HTMLElement) || !(selector instanceof HTMLElement)) return null;
      for (const child of [...app.children]) if (child !== selector) child.remove();
      selector.setSnapshot({ ...selector.presenterSnapshot, selectedProfileId: "spatial-cut", sessionState: "paused_manual" });
      const bounds = selector.getBoundingClientRect();
      const controls = [...(selector.shadowRoot?.querySelectorAll("button") ?? [])].map((control) => control.getBoundingClientRect());
      const panel = selector.shadowRoot?.querySelector("[part='panel']");
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      return { pageLeft: bounds.left + scrollX, pageTop: bounds.top + scrollY, pageRight: bounds.right + scrollX, pageBottom: bounds.bottom + scrollY, pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, viewportWidth: document.documentElement.clientWidth, controlsInside: controls.every((control) => control.left >= bounds.left && control.right <= bounds.right && control.top >= bounds.top && control.bottom <= bounds.bottom), overflowVisible: getComputedStyle(selector).overflowY !== "hidden" && (!(panel instanceof HTMLElement) || getComputedStyle(panel).overflowY !== "hidden") };
    });
    assert(Boolean(evidenceBounds) && evidenceBounds.pageLeft >= 0 && evidenceBounds.pageTop >= 0 && evidenceBounds.pageRight <= evidenceBounds.pageWidth && evidenceBounds.pageWidth <= evidenceBounds.viewportWidth && evidenceBounds.controlsInside && evidenceBounds.overflowVisible, `${viewport.name} profile evidence clipped or overflowed its full-page capture: ${JSON.stringify(evidenceBounds)}.`);
    const screenshot = await evidencePage.screenshot({ path: `screenshots/task11-ui-profiles-${viewport.name}.png`, fullPage: true });
    const capturedWidth = screenshot.readUInt32BE(16);
    const capturedHeight = screenshot.readUInt32BE(20);
    assert(evidenceBounds.pageRight <= capturedWidth && evidenceBounds.pageBottom <= capturedHeight && evidenceBounds.pageHeight <= capturedHeight, `${viewport.name} profile surface was outside the captured image.`);
    await evidencePage.close();
  }
  for (const viewport of [
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    const compactPage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await compactPage.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
    await compactPage.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    const compactBounds = await compactPage.evaluate(() => {
      const app = document.querySelector("#app");
      if (!(app instanceof HTMLElement)) return null;
      const drawerNames = new Set(["AERO-BEATSAVER-BROWSER", "AERO-CONTENT-IMPORT-PROGRESS", "AERO-CONTENT-LIBRARY", "AERO-CALIBRATION-BADGE", "AERO-CAPABILITIES-PANEL", "AERO-PROTOTYPE-SELECTOR", "AERO-FULLSCREEN-BUTTON"]);
      for (const child of [...app.children]) if (!drawerNames.has(child.tagName)) child.remove();
      const mapBrowser = app.querySelector("aero-beatsaver-browser");
      mapBrowser?.setSnapshot({ state: "results", query: "Papercut", results: [{ mapId: "4858", name: "Papercut", songAuthorName: "Linkin Park" }], selectedMap: { mapId: "4858", name: "Papercut", songAuthorName: "Linkin Park", levelAuthorName: "Mapper" }, versions: [{ versionHash: "a".repeat(40), label: "Current version" }], difficulties: ["Hard", "Expert"], selectedVersionHash: "a".repeat(40), selectedDifficulty: "Expert" });
      const selector = app.querySelector("aero-prototype-selector");
      selector?.setSnapshot({ ...selector.presenterSnapshot, selectedProfileId: "spatial-cut", sessionState: "paused_manual" });
      const error = document.createElement("aero-error-panel");
      error.setSnapshot({ code: "camera_permission_denied", message: "Camera permission is required.", retryable: true });
      app.append(error);
      const hosts = [...app.children];
      for (const host of hosts) Reflect.set(host, "compact", true);
      const controls = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])]);
      const headings = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("h1,h2,h3,.compact-converter-truth") ?? [])]);
      const hiddenMetadata = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll(".compact-identity,.compact-telemetry,.muted:not(.live):not(.compact-critical):not(.compact-converter-truth),.pill:not(.error)") ?? [])]);
      const bounds = app.getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        appRight: bounds.right,
        compactHosts: hosts.length,
        visibleHeadings: headings.filter((heading) => { const box = heading.getBoundingClientRect(); return box.width > 1 || box.height > 1; }).length,
        visibleMetadata: hiddenMetadata.filter((entry) => getComputedStyle(entry).display !== "none").length,
        controlsValid: controls.length > 0 && controls.every((control) => { const box = control.getBoundingClientRect(); return getComputedStyle(control).display !== "none" && box.width >= 42 && box.height >= 42 && box.left >= 0 && box.right <= document.documentElement.clientWidth; }),
        criticalErrorVisible: getComputedStyle(error.shadowRoot?.querySelector(".error")).display !== "none",
        progressVisible: hosts.filter((host) => host.shadowRoot?.querySelector("progress")).every((host) => getComputedStyle(host.shadowRoot?.querySelector("progress")).display !== "none")
      };
    });
    assert(Boolean(compactBounds) && compactBounds.compactHosts === 8 && compactBounds.scrollWidth <= compactBounds.viewportWidth && compactBounds.appRight <= compactBounds.viewportWidth && compactBounds.visibleHeadings === 0 && compactBounds.visibleMetadata === 0 && compactBounds.controlsValid && compactBounds.criticalErrorVisible && compactBounds.progressVisible, `${viewport.name} compact action drawer clipped, exposed metadata, or hid critical/action state: ${JSON.stringify(compactBounds)}.`);
    await compactPage.screenshot({ path: `screenshots/task12-ui-compact-${viewport.name}.png`, fullPage: true });
    await compactPage.close();
  }
  for (const viewport of [
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    const scopedPage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await scopedPage.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
    await scopedPage.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    const scopedEvidence = await scopedPage.evaluate(() => {
      const app = document.querySelector("#app");
      const source = document.querySelector("aero-prototype-selector");
      if (!(app instanceof HTMLElement) || !source) return null;
      const snapshot = source.presenterSnapshot;
      app.replaceChildren();
      const gameplay = document.createElement("aero-prototype-selector");
      const visuals = document.createElement("aero-prototype-selector");
      gameplay.setAttribute("scope", "gameplay");
      visuals.setAttribute("scope", "visuals");
      gameplay.setAttribute("compact", "");
      visuals.setAttribute("compact", "");
      gameplay.setSnapshot({ selectedProfileId: "spatial-cut", sessionState: "idle" });
      visuals.setSnapshot(snapshot);
      const intents = [];
      gameplay.addEventListener("aero:ui:intent", (event) => { if (event instanceof CustomEvent) intents.push(event.detail); });
      app.append(gameplay, visuals);
      gameplay.shadowRoot?.querySelector("input[value='boxing_semantic_track_v1']")?.click();
      gameplay.shadowRoot?.querySelector("input[value='row_family_balanced_height_v1']")?.click();
      const sections = [gameplay, visuals];
      const controls = sections.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])]);
      const visibleText = sections.map((host) => host.shadowRoot?.querySelector("section")?.textContent ?? "").join(" ");
      const conversionLegend = gameplay.shadowRoot?.querySelector(".product-group-heading");
      const conversionLegendBounds = conversionLegend?.getBoundingClientRect();
      const conversionLegendStyle = conversionLegend ? getComputedStyle(conversionLegend) : null;
      return {
        labels: sections.map((host) => [...(host.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? "")),
        checked: sections.map((host) => host.shadowRoot?.querySelectorAll("input:checked").length ?? 0),
        conversionLegendText: conversionLegend?.textContent?.trim() ?? "",
        conversionLegendVisible: Boolean(conversionLegendStyle && conversionLegendBounds && conversionLegendStyle.display !== "none" && conversionLegendStyle.visibility === "visible" && Number(conversionLegendStyle.opacity) > 0 && conversionLegendBounds.width > 1 && conversionLegendBounds.height > 1),
        modeIntent: intents.find((intent) => intent?.type === "gameplay-mode-select")?.payload,
        conversionIntent: intents.find((intent) => intent?.type === "boxing-conversion-select")?.payload,
        forbiddenText: /(schema|ruleset|recipe|hash|profile|scoring|converter|regeneration|bundle|experimental)/iu.test(visibleText),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        controlsVisible: controls.every((control) => { const bounds = control.getBoundingClientRect(); const style = getComputedStyle(control); return bounds.width >= 42 && bounds.height >= 42 && bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth && style.appearance !== "none" && style.visibility === "visible"; })
      };
    });
    assert(Boolean(scopedEvidence) && scopedEvidence.labels[0].join("|") === "Flow|Boxing Lanes|Boxing Grid|Balanced Height|Source Height" && scopedEvidence.labels[1].join("|") === "Default|Compact" && scopedEvidence.checked.join(",") === "2,1" && scopedEvidence.conversionLegendText === "Conversion" && scopedEvidence.conversionLegendVisible && scopedEvidence.modeIntent?.rulesetId === "boxing_semantic_track_v1" && Object.keys(scopedEvidence.modeIntent ?? {}).length === 1 && scopedEvidence.conversionIntent?.recipeId === "row_family_balanced_height_v1" && Object.keys(scopedEvidence.conversionIntent ?? {}).length === 1 && !scopedEvidence.forbiddenText && !scopedEvidence.overflow && scopedEvidence.controlsVisible, `${viewport.name} compact scoped product selector label/payload evidence failed: ${JSON.stringify(scopedEvidence)}.`);
    await scopedPage.screenshot({ path: `screenshots/task12-ui-product-scopes-${viewport.name}.png`, fullPage: true });
    await scopedPage.evaluate((sourceUrl) => {
      const iframe = document.createElement("iframe");
      iframe.id = "scoped-gameplay-iframe";
      iframe.src = sourceUrl;
      iframe.style.cssText = "border:0;display:block;height:100%;width:100%;box-sizing:border-box";
      document.body.append(iframe);
    }, `${url}.testbed/demo/product-ui-validation.html`);
    const iframeHandle = await scopedPage.waitForSelector("#scoped-gameplay-iframe");
    const scopedFrame = await iframeHandle.contentFrame();
    if (!scopedFrame) throw new Error(`${viewport.name} scoped iframe did not expose a frame.`);
    await scopedFrame.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    const iframeEvidence = await scopedFrame.evaluate(() => {
      const app = document.querySelector("#app");
      if (!(app instanceof HTMLElement)) return null;
      app.replaceChildren();
      const gameplay = document.createElement("aero-prototype-selector");
      gameplay.setAttribute("scope", "gameplay");
      gameplay.setAttribute("compact", "");
      gameplay.setSnapshot({ selectedProfileId: "spatial-cut", sessionState: "idle" });
      const intents = [];
      gameplay.addEventListener("aero:ui:intent", (event) => { if (event instanceof CustomEvent) intents.push(event.detail); });
      app.append(gameplay);
      const mode = gameplay.shadowRoot?.querySelector("input[name='gameplay-mode-choice']:checked")?.value ?? "";
      const conversion = gameplay.shadowRoot?.querySelector("input[name='boxing-conversion-choice']:checked")?.value ?? "";
      gameplay.shadowRoot?.querySelector("input[value='boxing_semantic_track_v1']")?.click();
      gameplay.shadowRoot?.querySelector("input[value='row_family_balanced_height_v1']")?.click();
      const conversionLegend = gameplay.shadowRoot?.querySelector(".product-group-heading");
      const conversionLegendBounds = conversionLegend?.getBoundingClientRect();
      const conversionLegendStyle = conversionLegend ? getComputedStyle(conversionLegend) : null;
      return {
        labels: [...(gameplay.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? ""),
        mode,
        conversion,
        checked: gameplay.shadowRoot?.querySelectorAll("input:checked").length ?? 0,
        conversionLegendText: conversionLegend?.textContent?.trim() ?? "",
        conversionLegendVisible: Boolean(conversionLegendStyle && conversionLegendBounds && conversionLegendStyle.display !== "none" && conversionLegendStyle.visibility === "visible" && Number(conversionLegendStyle.opacity) > 0 && conversionLegendBounds.width > 1 && conversionLegendBounds.height > 1),
        modeIntent: intents.find((intent) => intent?.type === "gameplay-mode-select")?.payload,
        conversionIntent: intents.find((intent) => intent?.type === "boxing-conversion-select")?.payload,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    assert(Boolean(iframeEvidence) && iframeEvidence.labels.join("|") === "Flow|Boxing Lanes|Boxing Grid|Balanced Height|Source Height" && iframeEvidence.mode === "boxing_spatial_grid_v1" && iframeEvidence.conversion === "cut_family_source_height_v1" && iframeEvidence.checked === 2 && iframeEvidence.conversionLegendText === "Conversion" && iframeEvidence.conversionLegendVisible && iframeEvidence.modeIntent?.rulesetId === "boxing_semantic_track_v1" && Object.keys(iframeEvidence.modeIntent ?? {}).length === 1 && iframeEvidence.conversionIntent?.recipeId === "row_family_balanced_height_v1" && Object.keys(iframeEvidence.conversionIntent ?? {}).length === 1 && !iframeEvidence.overflow, `${viewport.name} compact iframe scoped Gameplay label/payload evidence failed: ${JSON.stringify(iframeEvidence)}.`);
    await scopedPage.close();
  }
  for (const viewport of [
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    const musicPage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await musicPage.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
    await musicPage.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    const musicEvidence = await musicPage.evaluate(() => {
      const app = document.querySelector("#app");
      if (!(app instanceof HTMLElement)) return null;
      app.replaceChildren();
      const mapBrowser = document.createElement("aero-beatsaver-browser");
      mapBrowser.setAttribute("compact", "");
      mapBrowser.setSnapshot({ state: "results", query: "Music", results: [{ mapId: "alpha", name: "Alpha Song", songAuthorName: "Alpha Artist" }, { mapId: "beta", name: "Beta Song", songAuthorName: "Beta Artist" }], selectedMap: { mapId: "beta", name: "Beta Song", songAuthorName: "Beta Artist", levelAuthorName: "Mapper" }, versions: [{ versionHash: "a".repeat(40), label: "Current" }], difficulties: ["Hard"], selectedVersionHash: "a".repeat(40), selectedDifficulty: "Hard" });
      const multiMapBrowser = document.createElement("aero-beatsaver-browser");
      multiMapBrowser.setAttribute("compact", "");
      multiMapBrowser.setSnapshot({ state: "results", results: [{ mapId: "multi", name: "Multi Song", songAuthorName: "Artist" }], selectedMap: { mapId: "multi", name: "Multi Song" }, versions: [{ versionHash: "b".repeat(40), label: "One" }, { versionHash: "c".repeat(40), label: "Two" }], difficulties: ["Hard", "Expert"], selectedVersionHash: "b".repeat(40), selectedDifficulty: "Hard" });
      const zeroMapBrowser = document.createElement("aero-beatsaver-browser");
      zeroMapBrowser.setAttribute("compact", "");
      zeroMapBrowser.setSnapshot({ state: "results", results: [{ mapId: "zero", name: "Zero Song", songAuthorName: "Artist" }], selectedMap: { mapId: "zero", name: "Zero Song" }, versions: [], difficulties: [], selectedVersionHash: "", selectedDifficulty: "" });
      const library = document.createElement("aero-content-library");
      library.setAttribute("compact", "");
      library.setSnapshot({ selectedCollectionId: "collection-beta", selectedPackageId: "package-beta", songs: [
        { collectionId: "collection-alpha", songName: "Alpha Download", activePackageId: "package-alpha-hard", difficulties: [{ difficultyId: "Hard", label: "Hard", packageId: "package-alpha-hard" }, { difficultyId: "Expert", label: "Expert", packageId: "package-alpha-expert" }] },
        { collectionId: "collection-beta", songName: "Beta Download", activePackageId: "package-beta", difficulties: [{ difficultyId: "Expert", label: "Expert", packageId: "package-beta" }] }
      ], packages: [], usedBytes: 1024, quotaBytes: 4096 });
      const emptyLibrary = document.createElement("aero-content-library");
      emptyLibrary.setAttribute("compact", "");
      emptyLibrary.setSnapshot({ selectedPackageId: "missing", packages: [] });
      const oneLibrary = document.createElement("aero-content-library");
      oneLibrary.setAttribute("compact", "");
      oneLibrary.setSnapshot({ selectedPackageId: "missing", packages: [{ key: "one", packageId: "package-one", packageHash: `sha256:${"4".repeat(64)}`, songName: "Only Download", difficulty: "Normal", createdAtMs: 400, assetCount: 1, sourceCacheCount: 0 }] });
      const hostileLibrary = document.createElement("aero-content-library");
      hostileLibrary.setAttribute("compact", "");
      let hostileGetterCalls = 0;
      const accessorSong = { songName: "Accessor", activePackageId: "secret", difficulties: [{ difficultyId: "Hard", label: "Hard", packageId: "secret" }] };
      Object.defineProperty(accessorSong, "collectionId", { enumerable: true, get() { hostileGetterCalls += 1; return "secret"; } });
      hostileLibrary.setSnapshot({ songs: [accessorSong, { collectionId: "extra", songName: "Extra", activePackageId: "extra-package", difficulties: [{ difficultyId: "Hard", label: "Hard", packageId: "extra-package" }], extra: true }], packages: [{ packageId: "must-not-fallback", songName: "Hidden", difficulty: "Hard" }] });
      app.append(mapBrowser, multiMapBrowser, zeroMapBrowser, library, emptyLibrary, oneLibrary, hostileLibrary);
      const hosts = [mapBrowser, library];
      const radios = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])]);
      const buttons = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button") ?? [])]);
      const selects = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("select") ?? [])]);
      const localLabels = [...(library.shadowRoot?.querySelectorAll(".compact-library-choice span") ?? [])].map((label) => label.textContent?.trim() ?? "");
      const localActions = [...(library.shadowRoot?.querySelectorAll(".compact-library-actions button") ?? [])];
      const initialCheckedValues = hosts.map((host) => host.shadowRoot?.querySelector("input[type='radio']:checked")?.value ?? "");
      const initialLocalDifficulty = library.shadowRoot?.querySelector("output")?.textContent?.trim() ?? "";
      const captured = [];
      mapBrowser.addEventListener("aero:ui:intent", (event) => { if (event instanceof CustomEvent) captured.push(event.detail); });
      multiMapBrowser.addEventListener("aero:ui:intent", (event) => { if (event instanceof CustomEvent) captured.push(event.detail); });
      library.addEventListener("aero:ui:intent", (event) => { if (event instanceof CustomEvent) captured.push(event.detail); });
      const remoteVersionSelect = multiMapBrowser.shadowRoot?.querySelector("select[data-intent='beatsaver-version-select']");
      const beforeRemoteSelectClick = captured.length;
      remoteVersionSelect?.click();
      const remoteSelectClickStable = captured.length === beforeRemoteSelectClick && remoteVersionSelect === multiMapBrowser.shadowRoot?.querySelector("select[data-intent='beatsaver-version-select']");
      mapBrowser.shadowRoot?.querySelector("button[data-intent='beatsaver-preview-toggle']")?.click();
      mapBrowser.shadowRoot?.querySelector("button[data-intent='beatsaver-import']")?.click();
      library.shadowRoot?.querySelector("button[data-intent='library-preview-toggle']")?.click();
      const remotePreviewIntent = captured.find((intent) => intent?.type === "beatsaver-preview-toggle")?.payload;
      const remoteDownloadIntent = captured.find((intent) => intent?.type === "beatsaver-import")?.payload;
      const localPreviewIntent = captured.find((intent) => intent?.type === "library-preview-toggle")?.payload;
      mapBrowser.setSnapshot({ ...mapBrowser.presenterSnapshot, preview: { state: "playing", mapId: "beta", versionHash: "a".repeat(40), packageId: "", errorMessage: "" } });
      library.setSnapshot({ ...library.presenterSnapshot, preview: { state: "loading", mapId: "", versionHash: "", packageId: "package-beta", errorMessage: "" } });
      const remoteStop = mapBrowser.shadowRoot?.querySelector("button[data-intent='beatsaver-preview-toggle']")?.textContent?.trim() ?? "";
      const localStop = library.shadowRoot?.querySelector("button[data-intent='library-preview-toggle']")?.textContent?.trim() ?? "";
      mapBrowser.setSnapshot({ ...mapBrowser.presenterSnapshot, preview: { state: "ended", mapId: "beta", versionHash: "a".repeat(40), packageId: "", errorMessage: "" } });
      library.setSnapshot({ ...library.presenterSnapshot, preview: { state: "error", mapId: "", versionHash: "", packageId: "package-beta", errorMessage: "Preview unavailable." } });
      const remoteEnded = mapBrowser.shadowRoot?.querySelector("button[data-intent='beatsaver-preview-toggle']")?.textContent?.trim() ?? "";
      const localErrorLabel = library.shadowRoot?.querySelector("button[data-intent='library-preview-toggle']")?.textContent?.trim() ?? "";
      const localError = library.shadowRoot?.querySelector(".compact-library-actions [role='status'].error")?.textContent?.trim() ?? "";
      const alphaSong = library.shadowRoot?.querySelector("input[value='collection-alpha']");
      alphaSong?.focus();
      alphaSong?.click();
      const previewBleedAfterSongSwitch = Boolean(library.shadowRoot?.querySelector(".compact-library-actions [role='status'].error"));
      const switchedCollection = captured.findLast((intent) => intent?.type === "library-select")?.payload?.collectionId ?? "";
      const difficultySelect = library.shadowRoot?.querySelector("select[data-intent='library-difficulty-select']");
      const beforeDifficultyClick = captured.length;
      difficultySelect?.click();
      const difficultyClickStable = captured.length === beforeDifficultyClick && difficultySelect === library.shadowRoot?.querySelector("select[data-intent='library-difficulty-select']");
      if (difficultySelect instanceof HTMLSelectElement) { difficultySelect.value = "package-alpha-expert"; difficultySelect.dispatchEvent(new Event("change", { bubbles: true, composed: true })); }
      const difficultyIntent = captured.findLast((intent) => intent?.type === "library-difficulty-select")?.payload;
      const switchedActionIds = [...(library.shadowRoot?.querySelectorAll(".compact-library-actions button[data-intent='library-preview-toggle'],.compact-library-actions button[data-intent='library-export']") ?? [])].map((button) => button.dataset.value ?? "");
      library.shadowRoot?.querySelector("button[data-intent='library-delete-request']")?.click();
      const compactDeleteIntents = [...(library.shadowRoot?.querySelectorAll(".compact-library-actions button") ?? [])].map((button) => button.dataset.intent ?? "");
      const compactDeleteIds = [...(library.shadowRoot?.querySelectorAll(".compact-library-actions button") ?? [])].map((button) => button.dataset.value ?? "");
      const compactDeletePrompt = library.shadowRoot?.querySelector(".compact-library-actions [role='status']")?.textContent?.trim() ?? "";
      library.shadowRoot?.querySelector("button[data-intent='library-delete-cancel']")?.click();
      const compactDeleteCancelled = [...(library.shadowRoot?.querySelectorAll(".compact-library-actions button") ?? [])].map((button) => button.dataset.intent ?? "").join(",");
      const currentControls = hosts.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])]);
      const result = {
        mapLabels: [...(mapBrowser.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])].map((radio) => radio.closest("label")?.querySelector("strong")?.textContent?.trim() ?? ""),
        localLabels,
        checked: hosts.map((host) => host.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? 0),
        checkedValues: initialCheckedValues,
        initialLocalDifficulty,
        actionButtons: buttons.length,
        localActionIntents: localActions.map((button) => button.dataset.intent ?? ""),
        localActionIds: localActions.map((button) => button.dataset.value ?? ""),
        selectedActionAreas: library.shadowRoot?.querySelectorAll("[part='selected-actions']").length ?? 0,
        singletonOutputs: [...(mapBrowser.shadowRoot?.querySelectorAll(".compact-singleton-field output") ?? [])].map((output) => `${output.getAttribute("aria-label")}:${output.textContent?.trim() ?? ""}`),
        singletonSelects: mapBrowser.shadowRoot?.querySelectorAll("select").length ?? -1,
        multiSelects: multiMapBrowser.shadowRoot?.querySelectorAll("select").length ?? -1,
        zeroErrors: zeroMapBrowser.shadowRoot?.querySelectorAll("[role='status'].error").length ?? -1,
        zeroDisabledActions: [...(zeroMapBrowser.shadowRoot?.querySelectorAll("button[data-intent='beatsaver-preview-toggle'],button[data-intent='beatsaver-import']") ?? [])].every((button) => button.hasAttribute("disabled")),
        remotePreviewIntent,
        remoteDownloadIntent,
        remoteSelectClickStable,
        localPreviewIntent,
        remoteStop,
        localStop,
        remoteEnded,
        localErrorLabel,
        localError,
        noPlay: ![...buttons].some((button) => button.textContent?.trim() === "Play"),
        switchedCollection,
        previewBleedAfterSongSwitch,
        difficultyClickStable,
        difficultyIntent,
        switchedActionIds,
        compactDeleteIntents,
        compactDeleteIds,
        compactDeletePrompt,
        compactDeleteCancelled,
        emptyRadios: emptyLibrary.shadowRoot?.querySelectorAll("input[type='radio']").length ?? -1,
        emptyActions: emptyLibrary.shadowRoot?.querySelectorAll("button").length ?? -1,
        emptyText: emptyLibrary.shadowRoot?.textContent ?? "",
        oneChecked: oneLibrary.shadowRoot?.querySelector("input:checked")?.value ?? "",
        oneActions: [...(oneLibrary.shadowRoot?.querySelectorAll("button") ?? [])].map((button) => button.dataset.intent ?? ""),
        hostileGetterCalls,
        hostileRadios: hostileLibrary.shadowRoot?.querySelectorAll("input[type='radio']").length ?? -1,
        hostileText: hostileLibrary.shadowRoot?.textContent ?? "",
        selects: selects.length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        controlsVisible: currentControls.every((control) => { const bounds = control.getBoundingClientRect(); const style = getComputedStyle(control); return bounds.width >= 42 && bounds.height >= 42 && bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth && style.display !== "none"; })
      };
      multiMapBrowser.remove();
      zeroMapBrowser.remove();
      emptyLibrary.remove();
      oneLibrary.remove();
      hostileLibrary.remove();
      return result;
    });
    assert(Boolean(musicEvidence) && musicEvidence.mapLabels.join("|") === "Alpha Song|Beta Song" && musicEvidence.localLabels.join("|") === "Alpha Download|Beta Download" && musicEvidence.checked.join(",") === "1,1" && musicEvidence.checkedValues.join(",") === "beta,collection-beta" && musicEvidence.actionButtons === 8 && musicEvidence.localActionIntents.join(",") === "library-preview-toggle,library-export,library-delete-request" && musicEvidence.localActionIds.join(",") === "package-beta,package-beta,collection-beta" && musicEvidence.selectedActionAreas === 1 && musicEvidence.singletonOutputs.join("|") === "Version:Current" && musicEvidence.initialLocalDifficulty === "Expert" && musicEvidence.singletonSelects === 0 && musicEvidence.multiSelects === 1 && musicEvidence.zeroErrors === 1 && musicEvidence.zeroDisabledActions && musicEvidence.remotePreviewIntent?.mapId === "beta" && musicEvidence.remotePreviewIntent?.versionHash === "a".repeat(40) && Object.keys(musicEvidence.remotePreviewIntent).length === 2 && musicEvidence.remoteDownloadIntent?.mapId === "beta" && musicEvidence.remoteDownloadIntent?.versionHash === "a".repeat(40) && Object.keys(musicEvidence.remoteDownloadIntent).length === 2 && musicEvidence.remoteSelectClickStable && musicEvidence.localPreviewIntent?.packageId === "package-beta" && Object.keys(musicEvidence.localPreviewIntent).length === 1 && musicEvidence.remoteStop === "Stop" && musicEvidence.localStop === "Stop" && musicEvidence.remoteEnded === "Preview" && musicEvidence.localErrorLabel === "Preview" && musicEvidence.localError === "Preview unavailable." && musicEvidence.noPlay && musicEvidence.switchedCollection === "collection-alpha" && !musicEvidence.previewBleedAfterSongSwitch && musicEvidence.difficultyClickStable && musicEvidence.difficultyIntent?.collectionId === "collection-alpha" && musicEvidence.difficultyIntent?.packageId === "package-alpha-expert" && Object.keys(musicEvidence.difficultyIntent).length === 2 && musicEvidence.switchedActionIds.every((id) => id === "package-alpha-expert") && musicEvidence.compactDeleteIntents.join(",") === "library-preview-toggle,library-export,library-delete,library-delete-cancel" && musicEvidence.compactDeleteIds.join(",") === "package-alpha-expert,package-alpha-expert,collection-alpha,collection-alpha" && musicEvidence.compactDeletePrompt === "Delete Alpha Download?" && musicEvidence.compactDeleteCancelled === "library-preview-toggle,library-export,library-delete-request" && musicEvidence.emptyRadios === 0 && musicEvidence.emptyActions === 0 && musicEvidence.emptyText.includes("No downloaded songs") && musicEvidence.oneChecked === "package-one" && musicEvidence.oneActions.join(",") === "library-preview-toggle,library-export,library-delete-request" && musicEvidence.hostileGetterCalls === 0 && musicEvidence.hostileRadios === 0 && !musicEvidence.hostileText.includes("Hidden") && !musicEvidence.hostileText.includes("Extra") && musicEvidence.selects === 0 && !musicEvidence.overflow && musicEvidence.controlsVisible, `${viewport.name} populated Music radio evidence failed: ${JSON.stringify(musicEvidence)}.`);
    await musicPage.screenshot({ path: `screenshots/task12-ui-music-radios-${viewport.name}.png`, fullPage: true });
    await musicPage.close();
  }
  for (const viewport of [
    { name: "phone-portrait", width: 390, height: 844 },
    { name: "phone-landscape", width: 844, height: 390 }
  ]) {
    const allowlistPage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await allowlistPage.goto(`${url}.testbed/demo/product-ui-validation.html`, { waitUntil: "networkidle" });
    await allowlistPage.waitForFunction(() => Boolean(window.__aeroProductUiValidation));
    const allowlistEvidence = await allowlistPage.evaluate(() => {
      const app = document.querySelector("#app");
      const sourceSelector = document.querySelector("aero-prototype-selector");
      if (!(app instanceof HTMLElement) || !sourceSelector) return null;
      const gameplay = document.createElement("aero-prototype-selector");
      gameplay.setAttribute("scope", "gameplay");
      gameplay.setSnapshot({ selectedProfileId: "flow", sessionState: "idle" });
      const visuals = document.createElement("aero-prototype-selector");
      visuals.setAttribute("scope", "visuals");
      visuals.setSnapshot(sourceSelector.presenterSnapshot);
      const populated = document.createElement("aero-beatsaver-browser");
      populated.setSnapshot({ state: "results", query: "", results: [{ mapId: "hidden-map-alpha", name: "Alpha Song", songAuthorName: "Hidden Alpha Author" }, { mapId: "hidden-map-beta", name: "Beta Song", songAuthorName: "Hidden Beta Author" }], selectedMap: { mapId: "hidden-map-beta", name: "Redundant Beta Selection", songAuthorName: "Hidden Selected Author", levelAuthorName: "Hidden Mapper" }, versions: [{ versionHash: "f".repeat(40), label: "Current" }], difficulties: ["Hard"], selectedVersionHash: "f".repeat(40), selectedDifficulty: "Hard" });
      const empty = document.createElement("aero-beatsaver-browser");
      empty.setSnapshot({ state: "empty", query: "", results: [] });
      const importProgress = document.createElement("aero-content-import-progress");
      importProgress.setSnapshot({ state: "converting", progress: 0.63, jobId: "hidden-job-id" });
      const library = document.createElement("aero-content-library");
      library.setSnapshot({ selectedPackageId: "hidden-package-beta", usedBytes: 123456, quotaBytes: 999999, packages: [{ packageId: "hidden-package-alpha", name: "Alpha Package", songName: "Alpha Package", difficulty: "Hard", variantCount: 2 }, { packageId: "hidden-package-beta", name: "Beta Package", songName: "Beta Package", difficulty: "Expert", variantCount: 3 }] });
      const capabilities = document.createElement("aero-capabilities-panel");
      capabilities.setSnapshot({ camera: false, fullscreen: true, autoplay: true, webgl2: true, indexedDb: true, worker: true, directBeatSaverCors: true, localZipImport: true, limitations: ["Camera permission blocks play."] });
      const error = document.createElement("aero-error-panel");
      error.setSnapshot({ code: "hidden_error_code", message: "Camera permission is required.", retryable: true });
      const fullscreen = document.createElement("aero-fullscreen-button");
      fullscreen.setSnapshot({ supported: true, active: false, requestPending: false, errorCode: null });
      const hosts = { gameplay, visuals, populated, empty, importProgress, library, capabilities, error, fullscreen };
      app.replaceChildren(...Object.values(hosts));
      library.shadowRoot?.querySelector("button[data-intent='library-delete-request'][data-value='hidden-package-alpha']")?.click();
      const defaultMarkup = Object.values(hosts).map((host) => host.shadowRoot?.innerHTML ?? "");
      const defaultVisibleCopy = `${visibleTextFragments(populated).join(" ")} ${visibleTextFragments(library).join(" ")}`;
      const defaultCopyPreserved = ["Hidden Alpha Author", "hidden-map-alpha", "Redundant Beta Selection", "Hidden Mapper", "used", "2 playable variants"].every((text) => defaultVisibleCopy.includes(text));
      for (const host of Object.values(hosts)) host.setAttribute("compact", "");
      const visible = Object.fromEntries(Object.entries(hosts).map(([name, host]) => [name, visibleTextFragments(host)]));
      const controls = Object.values(hosts).flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])]);
      const bounds = app.getBoundingClientRect();
      const accessibilityNamesPresent = controls.every((control) => {
        const aria = control.getAttribute("aria-label")?.trim() ?? "";
        const text = control.textContent?.trim() ?? "";
        const label = control.closest("label")?.textContent?.trim() ?? "";
        return aria !== "" || text !== "" || label !== "";
      });
      for (const host of Object.values(hosts)) host.removeAttribute("compact");
      const defaultMarkupRestored = Object.values(hosts).every((host, index) => (host.shadowRoot?.innerHTML ?? "") === defaultMarkup[index]);
      for (const host of Object.values(hosts)) host.setAttribute("compact", "");
      const currentControls = Object.values(hosts).flatMap((host) => [...(host.shadowRoot?.querySelectorAll("button,input,select") ?? [])]);
      return {
        visible,
        accessibilityNamesPresent,
        defaultCopyPreserved,
        defaultMarkupRestored,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth || bounds.right > document.documentElement.clientWidth,
        controlsValid: currentControls.every((control) => { const box = control.getBoundingClientRect(); const style = getComputedStyle(control); return style.display !== "none" && box.width >= 42 && box.height >= 42 && box.left >= 0 && box.right <= document.documentElement.clientWidth; }),
        invalidControls: currentControls.map((control) => { const box = control.getBoundingClientRect(); const style = getComputedStyle(control); return { tag: control.tagName, intent: control.dataset.intent ?? "", text: control.textContent?.trim() ?? "", display: style.display, width: box.width, height: box.height, left: box.left, right: box.right }; }).filter((entry) => entry.display === "none" || entry.width < 42 || entry.height < 42 || entry.left < 0 || entry.right > document.documentElement.clientWidth)
      };

      function visibleTextFragments(host) {
        const fragments = [];
        if (!host.shadowRoot) return fragments;
        const walker = document.createTreeWalker(host.shadowRoot, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          const text = node.textContent?.replaceAll(/\s+/gu, " ").trim() ?? "";
          if (!parent || text === "" || parent.closest("style,script,option")) continue;
          const style = getComputedStyle(parent);
          const box = parent.getBoundingClientRect();
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || box.width <= 1 || box.height <= 1) continue;
          fragments.push(text);
        }
        return fragments;
      }
    });
    const expectedVisible = {
      gameplay: ["Flow", "Boxing Lanes", "Boxing Grid"],
      visuals: ["Default", "Compact"],
      populated: ["Search", "Latest", "Choose local ZIP", "Alpha Song", "Beta Song", "Preview", "Version", "Current", "Download"],
      empty: ["Search", "Latest", "Choose local ZIP"],
      importProgress: ["Converting · 63%", "Cancel import"],
      library: ["Alpha Package", "Beta Package", "Preview", "Difficulty", "Expert", "Export", "Delete"],
      capabilities: ["Camera permission blocks play."],
      error: ["Camera permission is required.", "Try again"],
      fullscreen: ["Enter fullscreen"]
    };
    assert(Boolean(allowlistEvidence) && JSON.stringify(allowlistEvidence.visible) === JSON.stringify(expectedVisible), `${viewport.name} compact composed visible-text allowlist failed: ${JSON.stringify(allowlistEvidence?.visible)}.`);
    assert(Boolean(allowlistEvidence) && allowlistEvidence.accessibilityNamesPresent && allowlistEvidence.defaultCopyPreserved && allowlistEvidence.defaultMarkupRestored && !allowlistEvidence.overflow && allowlistEvidence.controlsValid, `${viewport.name} compact allowlist accessibility/default/bounds failed: ${JSON.stringify(allowlistEvidence)}.`);
    const accessibleNameCounts = await Promise.all([
      allowlistPage.getByRole("radio", { name: "Alpha Song", exact: true }).count(),
      allowlistPage.getByRole("radio", { name: "Select Beta Package", exact: true }).count(),
      allowlistPage.getByRole("textbox", { name: "Search maps", exact: true }).count(),
      allowlistPage.locator('aero-beatsaver-browser').first().locator('output[aria-label="Version"]').count()
    ]);
    assert(accessibleNameCounts.join(",") === "1,1,2,1", `${viewport.name} compact controls lost exact accessible names: ${accessibleNameCounts.join(",")}.`);
    await allowlistPage.screenshot({ path: `screenshots/task12-ui-compact-copy-allowlist-${viewport.name}.png`, fullPage: true });
    await allowlistPage.close();
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
