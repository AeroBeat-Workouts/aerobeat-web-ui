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
  assert(result.managedProfileClasses === 3, "Visual, scoring, and converter profile classes were not all rendered.");
  assert(result.deterministicProfileState === "live_visual,between_run_ruleset,converter_regeneration|true", "Host-readable profile state was not immutable and canonical.");
  assert(result.scoringDisabled === true && result.scoringStatus.includes("Pause or finish"), "Playing-state scoring selection was not disabled with a reason.");
  assert(result.converterStatus.includes("e37f8b527ed5ce86738ce22007fc963f83bccd737893fb4728d3b83eaa044eea") && result.converterStatus.includes("a43b53a39c13c9e9efe59854aee0fa16efdcd3c6a29bc09f678d94b3fd8f0202"), "Converter selected/applied/pending truth was incomplete.");
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
  const visualProfile = result.intents.find((intent) => intent.type === "prototype-profile-select");
  assert(visualProfile?.payload.profileClass === "live_visual" && visualProfile.payload.profileId === "aero.visual.compact" && visualProfile.payload.profileVersion === "1.0.0" && visualProfile.payload.contentHash === "e65d53dfaafe8a859c08837acb3d447b10b03508bd5ae64677d273c93657d603", "Visual profile intent omitted bounded scalar identity fields.");
  for (const type of ["tuning-import-request", "tuning-export", "tuning-reset"]) assert(Object.keys(result.intents.find((intent) => intent.type === type)?.payload ?? {}).length === 0, `${type} leaked bundle data.`);
  for (const intent of result.intents) for (const value of Object.values(intent.payload)) assert(value === null || ["string", "number", "boolean"].includes(typeof value), `${intent.type} emitted a non-scalar payload value.`);
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
    const visualLabels = [...(visualsSelector.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? "");
    const gameplayChecked = gameplaySelector.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? 0;
    const visualChecked = visualsSelector.shadowRoot?.querySelectorAll("input[type='radio']:checked").length ?? 0;
    const gameplaySelected = gameplaySelector.shadowRoot?.querySelector("input:checked")?.value ?? "";
    const visualSelected = visualsSelector.shadowRoot?.querySelector("input:checked")?.value ?? "";
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
    const detachedScopedInput = gameplayFallback.shadowRoot?.querySelector("input[value='semantic-row']");
    gameplayFallback.remove();
    const beforeDetachedScoped = captured.filter((intent) => intent.type === "prototype-select").length;
    detachedScopedInput?.click();
    document.body.append(gameplayFallback);
    gameplayFallback.shadowRoot?.querySelector("input[value='semantic-row']")?.click();
    const scopedReconnectIntentCount = captured.filter((intent) => intent.type === "prototype-select").length - beforeDetachedScoped;

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
    const compactAccessibleFields = isolatedBrowser.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Search maps" && isolatedBrowser.shadowRoot?.querySelector("select")?.getAttribute("aria-label") === "Version";
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
      visualLabels,
      gameplayChecked,
      visualChecked,
      gameplaySelected,
      visualSelected,
      scopedText,
      nativeRadioVisibility,
      scopedVisualIntent,
      gameplayFallbackId,
      visualFallbackId,
      scopedAtomicRejection,
      scopedReconnectIntentCount,
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
  const scopedTabExited = await page.evaluate(() => document.activeElement?.id === "after-scoped-keyboard-test");
  await page.keyboard.press("Shift+Tab");
  const scopedTabReturned = await page.evaluate(() => {
    const scoped = document.querySelector("#scoped-keyboard-test");
    const returned = scoped?.shadowRoot?.activeElement?.value ?? "";
    scoped?.remove();
    document.querySelector("#after-scoped-keyboard-test")?.remove();
    return returned;
  });
  assert(scopedArrow.checked === "semantic-cut" && scopedArrow.focused === "semantic-cut" && scopedTabExited && scopedTabReturned === "semantic-cut", "Scoped native radio Arrow/Tab keyboard behavior failed.");
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
  assert(adversarial.gameplayLabels.join("|") === "Flow|Semantic Row|Spatial Row|Semantic Cut|Spatial Cut" && adversarial.visualLabels.join("|") === "Default|Compact", "Scoped selectors exposed incorrect product labels.");
  assert(adversarial.gameplayChecked === 1 && adversarial.visualChecked === 1 && adversarial.gameplaySelected === "spatial-row" && adversarial.visualSelected === "aero.visual.default", "Scoped selectors did not preserve exactly one valid active selection.");
  assert(!/(schema|ruleset|recipe|hash|profile|scoring|converter|regeneration|bundle|experimental)/iu.test(adversarial.scopedText), `Scoped selectors exposed development text: ${adversarial.scopedText}`);
  assert(adversarial.nativeRadioVisibility, "Scoped product radios were not visibly native, computed, touch-sized radio inputs.");
  assert(adversarial.scopedVisualIntent?.profileClass === "live_visual" && adversarial.scopedVisualIntent.profileId === "aero.visual.compact" && adversarial.scopedVisualIntent.profileVersion === "1.0.0" && adversarial.scopedVisualIntent.contentHash === "e65d53dfaafe8a859c08837acb3d447b10b03508bd5ae64677d273c93657d603", "Scoped Visuals changed the scalar profile-selection intent.");
  assert(adversarial.gameplayFallbackId === "flow" && adversarial.visualFallbackId === "aero.visual.default", "Scoped selector first-option fallbacks were not deterministic.");
  assert(adversarial.scopedAtomicRejection && adversarial.scopedReconnectIntentCount === 1, `Scoped selector atomicity or reconnect listener exactness regressed: ${JSON.stringify({ atomic: adversarial.scopedAtomicRejection, reconnectIntents: adversarial.scopedReconnectIntentCount })}`);
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
      gameplay.setSnapshot({ selectedProfileId: "flow", sessionState: "idle" });
      visuals.setSnapshot(snapshot);
      app.append(gameplay, visuals);
      const sections = [gameplay, visuals];
      const controls = sections.flatMap((host) => [...(host.shadowRoot?.querySelectorAll("input[type='radio']") ?? [])]);
      const visibleText = sections.map((host) => host.shadowRoot?.querySelector("section")?.textContent ?? "").join(" ");
      return {
        labels: sections.map((host) => [...(host.shadowRoot?.querySelectorAll("label span") ?? [])].map((label) => label.textContent ?? "")),
        checked: sections.map((host) => host.shadowRoot?.querySelectorAll("input:checked").length ?? 0),
        forbiddenText: /(schema|ruleset|recipe|hash|profile|scoring|converter|regeneration|bundle|experimental)/iu.test(visibleText),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        controlsVisible: controls.every((control) => { const bounds = control.getBoundingClientRect(); const style = getComputedStyle(control); return bounds.width >= 42 && bounds.height >= 42 && bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth && style.appearance !== "none" && style.visibility === "visible"; })
      };
    });
    assert(Boolean(scopedEvidence) && scopedEvidence.labels[0].join("|") === "Flow|Semantic Row|Spatial Row|Semantic Cut|Spatial Cut" && scopedEvidence.labels[1].join("|") === "Default|Compact" && scopedEvidence.checked.join(",") === "1,1" && !scopedEvidence.forbiddenText && !scopedEvidence.overflow && scopedEvidence.controlsVisible, `${viewport.name} scoped product selector evidence failed: ${JSON.stringify(scopedEvidence)}.`);
    await scopedPage.screenshot({ path: `screenshots/task12-ui-product-scopes-${viewport.name}.png`, fullPage: true });
    await scopedPage.close();
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
