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
  throw new Error("Vite did not expose a Visual Test transport validation URL.");
}

const browser = await chromium.launch();
/** @type {string[]} */
const consoleNoise = [];
/** @type {string[]} */
const pageErrors = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") consoleNoise.push(`${message.type()}: ${message.text()}`); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${url}.testbed/scenes/aero-visual-test-transport.scene.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(customElements.get("aero-visual-test-transport")));

  const initial = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const root = host?.shadowRoot;
    const button = root?.querySelector("button[data-role='play-pause']");
    const range = root?.querySelector("input[data-role='timeline']");
    const timecode = root?.querySelector("time");
    const volumeButton = root?.querySelector("button[data-role='volume-toggle']");
    const music = root?.querySelector("input[data-role='music-volume']");
    const sound = root?.querySelector("input[data-role='sound-volume']");
    const popover = root?.querySelector(".volume-popover");
    if (!(host instanceof HTMLElement) || !(button instanceof HTMLButtonElement) || !(range instanceof HTMLInputElement) || !(timecode instanceof HTMLTimeElement) || !(volumeButton instanceof HTMLButtonElement) || !(music instanceof HTMLInputElement) || !(sound instanceof HTMLInputElement) || !(popover instanceof HTMLElement)) return null;
    const buttonRect = button.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    const timeRect = timecode.getBoundingClientRect();
    const volumeRect = volumeButton.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    return {
      hidden: host.hidden,
      buttonText: button.textContent,
      buttonName: button.getAttribute("aria-label"),
      rangeValue: range.value,
      rangeMax: range.max,
      rangeText: range.getAttribute("aria-valuetext"),
      timecode: timecode.textContent,
      volumeButtonName: volumeButton.getAttribute("aria-label"),
      volumeExpanded: volumeButton.getAttribute("aria-expanded"),
      volumeValues: [music.value, sound.value],
      volumeBounds: [music.min, music.max, music.step, sound.min, sound.max, sound.step],
      volumeOrientations: [music.getAttribute("aria-orientation"), sound.getAttribute("aria-orientation")],
      popoverHidden: popover.hidden,
      popoverDisplay: getComputedStyle(popover).display,
      popoverGeometry: [popoverRect.width, popoverRect.height, popover.getClientRects().length],
      controlHeights: [buttonRect.height, rangeRect.height, volumeRect.height],
      order: buttonRect.right <= rangeRect.left && rangeRect.right <= timeRect.left && timeRect.right <= volumeRect.left,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      snapshotFrozen: Object.isFrozen(host.transportSnapshot)
    };
  });
  assert(initial !== null && initial.hidden === false, "Active Visual Test transport was hidden.");
  assert(initial.buttonText === "Play" && initial.buttonName === "Play Visual Test", "Paused transport did not expose Play.");
  assert(initial.rangeValue === "65000" && initial.rangeMax === "180000" && initial.rangeText === "01:05" && initial.timecode === "01:05", "Initial range/timecode truth was incorrect.");
  assert(initial.volumeButtonName === "Open volume controls" && initial.volumeExpanded === "false" && initial.popoverHidden && JSON.stringify(initial.volumeValues) === JSON.stringify(["0.5", "0.5"]), "Initial volume defaults/open state were incorrect.");
  assert(initial.popoverDisplay === "none" && initial.popoverGeometry.every((value) => value === 0), `Closed volume popover rendered by default: ${JSON.stringify({ display: initial.popoverDisplay, geometry: initial.popoverGeometry })}`);
  assert(JSON.stringify(initial.volumeBounds) === JSON.stringify(["0", "1", "0.01", "0", "1", "0.01"]) && initial.volumeOrientations.every((value) => value === "vertical"), "Native volume range bounds/orientation were incorrect.");
  assert(initial.controlHeights.every((height) => height >= 42), "Transport controls are smaller than 42px.");
  assert(initial.order === true, "Play/range/timecode/volume are not ordered left-to-right.");
  assert(initial.reduced === true && initial.snapshotFrozen === true, "Reduced-motion or immutable-state contract failed.");

  await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    if (!host) return;
    const intents = [];
    Reflect.set(window, "__aeroTransportIntents", intents);
    host.addEventListener("aero:ui:intent", (event) => {
      if (!(event instanceof CustomEvent)) return;
      intents.push({ type: event.detail?.type, payload: event.detail?.payload, detailFrozen: Object.isFrozen(event.detail), payloadFrozen: Object.isFrozen(event.detail?.payload), bubbles: event.bubbles, composed: event.composed });
    });
  });

  await page.locator("aero-visual-test-transport button[data-role='play-pause']").click();
  await page.evaluate(() => document.querySelector("aero-visual-test-transport")?.setSnapshot({ active: true, playing: true, currentMs: 65_000, durationMs: 180_000, musicVolume: 0.5, soundVolume: 0.5 }));
  await page.locator("aero-visual-test-transport button[data-role='play-pause']").click();
  const playPause = await page.evaluate(() => Reflect.get(window, "__aeroTransportIntents"));
  assert(playPause[0]?.type === "visual-test-play" && Object.keys(playPause[0].payload).length === 0, "Play intent was not empty and exact.");
  assert(playPause[1]?.type === "visual-test-pause" && Object.keys(playPause[1].payload).length === 0, "Pause intent was not empty and exact.");
  assert(playPause.every((intent) => intent.detailFrozen && intent.payloadFrozen && intent.bubbles && intent.composed), "Transport intents are mutable or do not cross the bubbling/composed boundary.");

  const scrub = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const range = host?.shadowRoot?.querySelector("input[type='range']");
    if (!host || !(range instanceof HTMLInputElement)) return null;
    host.setSnapshot({ active: true, playing: true, currentMs: 65_000, durationMs: 180_000, musicVolume: 0.5, soundVolume: 0.5 });
    range.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }));
    range.value = "90000";
    range.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertReplacementText" }));
    return { timecode: host.shadowRoot?.querySelector("time")?.textContent, rangeText: range.getAttribute("aria-valuetext") };
  });
  const afterScrub = await page.evaluate(() => Reflect.get(window, "__aeroTransportIntents"));
  const scrubTail = afterScrub.slice(-2);
  assert(scrub?.timecode === "01:30" && scrub.rangeText === "01:30", "Live scrub did not update visible/accessible timecode.");
  assert(scrubTail[0]?.type === "visual-test-pause" && Object.keys(scrubTail[0].payload).length === 0, "Scrub did not pause first with an empty intent.");
  assert(scrubTail[1]?.type === "visual-test-seek" && JSON.stringify(scrubTail[1].payload) === JSON.stringify({ milliseconds: 90_000 }), "Scrub seek intent was not the exact scalar milliseconds payload.");

  const beforeVolumeCount = afterScrub.length;
  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  const volume = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const root = host?.shadowRoot;
    const music = root?.querySelector("input[data-role='music-volume']");
    const sound = root?.querySelector("input[data-role='sound-volume']");
    const popover = root?.querySelector(".volume-popover");
    const toggle = root?.querySelector("button[data-role='volume-toggle']");
    if (!host || !(music instanceof HTMLInputElement) || !(sound instanceof HTMLInputElement) || !(popover instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement)) return null;
    const stableMusic = music;
    host.setSnapshot({ active: true, playing: false, currentMs: 90_000, durationMs: 180_000, musicVolume: 0.37, soundVolume: 0.82 });
    const focusStable = root?.activeElement === stableMusic && root?.querySelector("input[data-role='music-volume']") === stableMusic;
    music.value = "0.46";
    music.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertReplacementText" }));
    sound.value = "0.73";
    sound.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertReplacementText" }));
    const musicRect = music.getBoundingClientRect();
    const soundRect = sound.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const transportRect = root?.querySelector(".transport")?.getBoundingClientRect();
    const outputElements = [...root.querySelectorAll("output")];
    const outputRects = outputElements.map((entry) => entry.getBoundingClientRect());
    const outputs = outputElements.map((entry) => entry.textContent);
    return { open: !popover.hidden, display: getComputedStyle(popover).display, rendered: popoverRect.width > 0 && popoverRect.height > 0 && popover.getClientRects().length > 0, expanded: toggle.getAttribute("aria-expanded"), name: toggle.getAttribute("aria-label"), focused: root.activeElement === music, focusStable, values: [music.value, sound.value], labels: [music.getAttribute("aria-label"), sound.getAttribute("aria-label")], texts: [music.getAttribute("aria-valuetext"), sound.getAttribute("aria-valuetext")], outputs, rangeRects: [musicRect, soundRect], outputRects, popoverRect, transportRect, intents: Reflect.get(window, "__aeroTransportIntents") };
  });
  assert(volume?.open && volume.display === "grid" && volume.rendered && volume.expanded === "true" && volume.name === "Close volume controls" && volume.focused && volume.focusStable, "Volume popover open/rendering/focus/stable-DOM contract failed.");
  assert(JSON.stringify(volume.values) === JSON.stringify(["0.5", "0.73"]) && JSON.stringify(volume.labels) === JSON.stringify(["Music volume", "Sound volume"]) && JSON.stringify(volume.texts) === JSON.stringify(["0.5", "0.7"]) && JSON.stringify(volume.outputs) === JSON.stringify(["0.5", "0.7"]), "Volume snapping/accessibility/value labels were incorrect.");
  assert(volume.rangeRects.every((rect) => rect.width >= 44 && rect.height >= 44) && volume.rangeRects[0].right <= volume.rangeRects[1].left && volume.outputRects.every((rect, index) => rect.bottom <= volume.rangeRects[index].top) && volume.popoverRect.left >= 0 && volume.popoverRect.right <= 390 && volume.popoverRect.bottom <= volume.transportRect.top, "Volume ordering, value-above-track, hit areas, or popover placement were invalid.");
  const volumeTail = volume.intents.slice(-2);
  assert(volume.intents.length === beforeVolumeCount + 2, "Volume button implicitly emitted an intent or muted playback.");
  assert(volumeTail[0]?.type === "visual-test-music-volume" && JSON.stringify(volumeTail[0].payload) === JSON.stringify({ volume: 0.5 }), "Music intent was not exact snapped scalar volume.");
  assert(volumeTail[1]?.type === "visual-test-sound-volume" && JSON.stringify(volumeTail[1].payload) === JSON.stringify({ volume: 0.73 }), "Sound intent was not exact fine scalar volume.");
  assert(volumeTail.every((intent) => intent.detailFrozen && intent.payloadFrozen && intent.bubbles && intent.composed), "Volume intents are mutable or do not bubble across the composed boundary.");

  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  const buttonClosed = await page.evaluate(() => {
    const root = document.querySelector("aero-visual-test-transport")?.shadowRoot;
    const button = root?.querySelector("button[data-role='volume-toggle']");
    const popover = root?.querySelector(".volume-popover");
    const rect = popover?.getBoundingClientRect();
    return { hidden: popover?.hasAttribute("hidden"), display: popover instanceof HTMLElement ? getComputedStyle(popover).display : null, geometry: rect ? [rect.width, rect.height, popover?.getClientRects().length] : null, focusReturned: root?.activeElement === button, intentCount: Reflect.get(window, "__aeroTransportIntents")?.length };
  });
  assert(buttonClosed.hidden && buttonClosed.display === "none" && buttonClosed.geometry?.every((value) => value === 0) && buttonClosed.focusReturned && buttonClosed.intentCount === beforeVolumeCount + 2, `Volume button close changed mix, emitted an intent, failed focus restoration, or remained rendered: ${JSON.stringify(buttonClosed)}`);

  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  await page.evaluate(() => document.querySelector("main")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" })));
  const pointerClosed = await page.evaluate(() => {
    const popover = document.querySelector("aero-visual-test-transport")?.shadowRoot?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, geometry: [rect.width, rect.height, popover.getClientRects().length] };
  });
  assert(pointerClosed?.hidden && pointerClosed.display === "none" && pointerClosed.geometry.every((value) => value === 0), `Outside composed pointerdown did not remove volume controls from rendering: ${JSON.stringify(pointerClosed)}`);

  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  await page.evaluate(() => document.querySelector("main")?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })));
  const clickClosed = await page.evaluate(() => {
    const popover = document.querySelector("aero-visual-test-transport")?.shadowRoot?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, geometry: [rect.width, rect.height, popover.getClientRects().length] };
  });
  assert(clickClosed?.hidden && clickClosed.display === "none" && clickClosed.geometry.every((value) => value === 0), `Outside composed click did not remove volume controls from rendering: ${JSON.stringify(clickClosed)}`);

  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  await page.keyboard.press("Escape");
  const escapeClosed = await page.evaluate(() => {
    const root = document.querySelector("aero-visual-test-transport")?.shadowRoot;
    const button = root?.querySelector("button[data-role='volume-toggle']");
    const popover = root?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, geometry: [rect.width, rect.height, popover.getClientRects().length], focusReturned: root?.activeElement === button };
  });
  assert(escapeClosed?.hidden && escapeClosed.display === "none" && escapeClosed.geometry.every((value) => value === 0) && escapeClosed.focusReturned, `Escape did not remove volume controls from rendering and return focus: ${JSON.stringify(escapeClosed)}`);

  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  const hiddenClosed = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const root = host?.shadowRoot;
    const button = root?.querySelector("button[data-role='volume-toggle']");
    const popover = root?.querySelector(".volume-popover");
    if (!(host instanceof HTMLElement)) return null;
    host.hidden = true;
    const hiddenRect = popover?.getBoundingClientRect();
    const hiddenState = { hidden: popover?.hasAttribute("hidden"), display: popover instanceof HTMLElement ? getComputedStyle(popover).display : null, geometry: hiddenRect ? [hiddenRect.width, hiddenRect.height, popover?.getClientRects().length] : null, expanded: button?.getAttribute("aria-expanded") };
    host.hidden = false;
    const shownRect = popover?.getBoundingClientRect();
    return { ...hiddenState, staysClosed: popover?.hasAttribute("hidden"), staysDisplayNone: popover instanceof HTMLElement && getComputedStyle(popover).display === "none", staysGeometryZero: shownRect ? [shownRect.width, shownRect.height, popover?.getClientRects().length].every((value) => value === 0) : false, staysCollapsed: button?.getAttribute("aria-expanded") };
  });
  assert(hiddenClosed?.hidden && hiddenClosed.display === "none" && hiddenClosed.geometry?.every((value) => value === 0) && hiddenClosed.expanded === "false" && hiddenClosed.staysClosed && hiddenClosed.staysDisplayNone && hiddenClosed.staysGeometryZero && hiddenClosed.staysCollapsed === "false", `External hidden lifecycle did not close and remove the volume popover from rendering: ${JSON.stringify(hiddenClosed)}`);

  await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    host?.setSnapshot({ active: true, playing: false, currentMs: 10_000, durationMs: 20_000, musicVolume: 0.5, soundVolume: 0.73 });
  });
  await page.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  await page.locator("aero-visual-test-transport input[data-role='sound-volume']").focus();
  await page.keyboard.press("ArrowUp");
  const volumeKeyboard = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const range = host?.shadowRoot?.querySelector("input[data-role='sound-volume']");
    const intents = Reflect.get(window, "__aeroTransportIntents");
    return { focused: host?.shadowRoot?.activeElement === range, value: range instanceof HTMLInputElement ? range.value : "", text: range?.getAttribute("aria-valuetext"), intent: intents?.at(-1) };
  });
  assert(volumeKeyboard.focused && volumeKeyboard.value === "0.74" && volumeKeyboard.text === "0.7", "Native vertical volume keyboard behavior or focus was lost.");
  assert(volumeKeyboard.intent?.type === "visual-test-sound-volume" && volumeKeyboard.intent.payload.volume === 0.74 && volumeKeyboard.intent.bubbles && volumeKeyboard.intent.composed, "Keyboard volume input did not emit the exact bounded sound intent.");
  await page.keyboard.press("Escape");

  await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const range = host?.shadowRoot?.querySelector("input[data-role='timeline']");
    if (range instanceof HTMLInputElement) range.focus();
  });
  await page.keyboard.press("ArrowRight");
  const keyboard = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const range = host?.shadowRoot?.querySelector("input[type='range']");
    const intents = Reflect.get(window, "__aeroTransportIntents");
    return { active: host?.shadowRoot?.activeElement === range, value: range instanceof HTMLInputElement ? range.value : "", intent: intents.at(-1) };
  });
  assert(keyboard.active === true && keyboard.value === "10001", "Native range keyboard behavior or focus was lost.");
  assert(keyboard.intent?.type === "visual-test-seek" && keyboard.intent.payload.milliseconds === 10_001, "Keyboard range input did not emit exact seek milliseconds.");

  const stateBoundary = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    if (!host) return null;
    const mutable = { active: true, playing: false, currentMs: 99_999, durationMs: 12_000, musicVolume: 0.5, soundVolume: 0.5 };
    host.setSnapshot(mutable);
    mutable.currentMs = 0;
    const clamped = { hidden: host.hidden, currentMs: host.transportSnapshot.currentMs, text: host.shadowRoot?.querySelector("time")?.textContent };
    host.shadowRoot?.querySelector("button[data-role='volume-toggle']")?.click();
    host.setSnapshot({ active: false, playing: false, currentMs: 0, durationMs: 12_000, musicVolume: 0.5, soundVolume: 0.5 });
    const inactiveHidden = host.hidden;
    const inactivePopover = host.shadowRoot?.querySelector(".volume-popover");
    const inactiveRect = inactivePopover?.getBoundingClientRect();
    const volumeClosedOnHide = inactivePopover?.hasAttribute("hidden");
    const inactivePopoverDisplay = inactivePopover instanceof HTMLElement ? getComputedStyle(inactivePopover).display : null;
    const inactivePopoverGeometry = inactiveRect ? [inactiveRect.width, inactiveRect.height, inactivePopover?.getClientRects().length] : null;
    let getterCalls = 0;
    const hostile = { active: true, playing: false, currentMs: 1, durationMs: 12_000, musicVolume: 0.5 };
    Object.defineProperty(hostile, "soundVolume", { enumerable: true, get() { getterCalls += 1; return 0.5; } });
    host.setSnapshot(hostile);
    return { clamped, inactiveHidden, volumeClosedOnHide, inactivePopoverDisplay, inactivePopoverGeometry, getterCalls, hostileHidden: host.hidden, exactKeys: Object.keys(host.transportSnapshot).sort().join(",") };
  });
  assert(stateBoundary?.clamped.currentMs === 12_000 && stateBoundary.clamped.text === "00:12", "State did not copy/clamp current time.");
  assert(stateBoundary.inactiveHidden === true && stateBoundary.volumeClosedOnHide === true && stateBoundary.inactivePopoverDisplay === "none" && stateBoundary.inactivePopoverGeometry?.every((value) => value === 0), `Transport/popover remained rendered outside Visual Test: ${JSON.stringify(stateBoundary)}`);
  assert(stateBoundary.getterCalls === 0 && stateBoundary.hostileHidden === true, "Accessor-bearing state was executed or retained.");
  assert(stateBoundary.exactKeys === "active,currentMs,durationMs,musicVolume,playing,soundVolume", "Public transport state has an unexpected field.");

  const lifecycle = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    if (!host) return null;
    host.setSnapshot({ active: true, playing: false, currentMs: 0, durationMs: 20_000, musicVolume: 0.5, soundVolume: 0.5 });
    let count = 0;
    host.addEventListener("aero:ui:intent", () => { count += 1; });
    const detachedButton = host.shadowRoot?.querySelector("button[data-role='play-pause']");
    const detachedVolume = host.shadowRoot?.querySelector("button[data-role='volume-toggle']");
    detachedVolume?.click();
    const openBeforeDetach = !host.shadowRoot?.querySelector(".volume-popover")?.hasAttribute("hidden");
    host.remove();
    detachedButton?.click();
    detachedVolume?.click();
    const detachedPopover = host.shadowRoot?.querySelector(".volume-popover");
    const detachedRect = detachedPopover?.getBoundingClientRect();
    const closedOnDetach = detachedPopover?.hasAttribute("hidden");
    const detachedGeometry = detachedRect ? [detachedRect.width, detachedRect.height, detachedPopover?.getClientRects().length] : null;
    const detachedCount = count;
    document.querySelector("main")?.append(host);
    const reconnectedPopover = host.shadowRoot?.querySelector(".volume-popover");
    const reconnectedRect = reconnectedPopover?.getBoundingClientRect();
    const reconnectedClosedRendering = reconnectedPopover instanceof HTMLElement && reconnectedPopover.hidden && getComputedStyle(reconnectedPopover).display === "none" && reconnectedRect !== undefined && [reconnectedRect.width, reconnectedRect.height, reconnectedPopover.getClientRects().length].every((value) => value === 0);
    host.shadowRoot?.querySelector("button[data-role='play-pause']")?.click();
    host.setSnapshot({ active: true, playing: false, currentMs: 1_000, durationMs: 20_000, musicVolume: 0.5, soundVolume: 0.5 });
    const range = host.shadowRoot?.querySelector("input[type='range']");
    range?.focus();
    host.setSnapshot({ active: true, playing: false, currentMs: 2_000, durationMs: 20_000, musicVolume: 0.5, soundVolume: 0.5 });
    return { openBeforeDetach, closedOnDetach, detachedGeometry, reconnectedClosedRendering, detachedCount, reconnectCount: count, focusStable: host.shadowRoot?.activeElement === range };
  });
  assert(lifecycle?.openBeforeDetach && lifecycle.closedOnDetach && lifecycle.detachedGeometry?.every((value) => value === 0) && lifecycle.reconnectedClosedRendering && lifecycle.detachedCount === 0 && lifecycle.reconnectCount === 1, `Disconnect/reconnect retained rendered popover/listeners or duplicated intents: ${JSON.stringify(lifecycle)}`);
  assert(lifecycle.focusStable === true, "Snapshot update replaced or blurred the focused timeline.");

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const host = document.querySelector("aero-visual-test-transport");
      if (!(host instanceof HTMLElement)) return null;
      host.style.setProperty("--aero-test-safe-area-bottom", "17px");
      host.style.setProperty("--aero-test-safe-area-left", "13px");
      host.style.setProperty("--aero-test-safe-area-right", "11px");
      host.setSnapshot({ active: true, playing: false, currentMs: 2_000, durationMs: 20_000, musicVolume: 0.5, soundVolume: 0.5 });
      const bar = host.shadowRoot?.querySelector(".transport");
      const toggle = host.shadowRoot?.querySelector("button[data-role='volume-toggle']");
      const time = host.shadowRoot?.querySelector("time");
      if (!(bar instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement) || !(time instanceof HTMLTimeElement)) return null;
      if (toggle.getAttribute("aria-expanded") === "true") toggle.click();
      toggle.click();
      const popover = host.shadowRoot?.querySelector(".volume-popover");
      const ranges = [...host.shadowRoot.querySelectorAll("input.volume-range")];
      if (!(popover instanceof HTMLElement) || ranges.some((entry) => !(entry instanceof HTMLInputElement))) return null;
      const hostRect = host.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const toggleRect = toggle.getBoundingClientRect();
      const timeRect = time.getBoundingClientRect();
      const style = getComputedStyle(bar);
      return { viewportWidth: document.documentElement.clientWidth, bodyWidth: document.body.scrollWidth, hostLeft: hostRect.left, hostRight: hostRect.right, barBottom: barRect.bottom, viewportHeight: innerHeight, paddingBottom: parseFloat(style.paddingBottom), paddingLeft: parseFloat(style.paddingLeft), paddingRight: parseFloat(style.paddingRight), timeBeforeVolume: timeRect.right <= toggleRect.left, toggleSize: [toggleRect.width,toggleRect.height], popoverWithin: popoverRect.left >= 0 && popoverRect.right <= innerWidth && popoverRect.top >= 0 && popoverRect.bottom <= barRect.top, rangeSizes: ranges.map((entry) => { const rect=entry.getBoundingClientRect(); return [rect.width,rect.height]; }) };
    });
    assert(layout !== null && layout.bodyWidth <= layout.viewportWidth && layout.hostLeft >= 0 && layout.hostRight <= layout.viewportWidth + 0.5, `Transport overflowed ${viewport.width}x${viewport.height}.`);
    assert(Math.abs(layout.barBottom - layout.viewportHeight) <= 0.5, `Transport did not stay bottom-aligned at ${viewport.width}x${viewport.height}.`);
    assert(layout.paddingBottom >= 17 && layout.paddingLeft >= 13 && layout.paddingRight >= 11, `Safe-area padding failed at ${viewport.width}x${viewport.height}.`);
    assert(layout.timeBeforeVolume && layout.toggleSize.every((value) => value >= 44) && layout.popoverWithin && layout.rangeSizes.every(([width,height]) => width >= 44 && height >= 44), `Volume/timecode ordering, hit area, or popover bounds failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
  }
  await context.close();

  const dprOneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const dprOnePage = await dprOneContext.newPage();
  dprOnePage.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") consoleNoise.push(`${message.type()}: ${message.text()}`); });
  dprOnePage.on("pageerror", (error) => pageErrors.push(error.message));
  await dprOnePage.goto(`${url}.testbed/scenes/aero-visual-test-transport.scene.html`, { waitUntil: "networkidle" });
  const dprOne = await dprOnePage.evaluate(() => ({ dpr: devicePixelRatio, overflow: document.body.scrollWidth > document.documentElement.clientWidth }));
  assert(dprOne.dpr === 1 && dprOne.overflow === false, "DPR1 portrait transport layout failed.");
  await dprOneContext.close();

  const iframeContext = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, reducedMotion: "reduce" });
  const iframePage = await iframeContext.newPage();
  iframePage.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") consoleNoise.push(`${message.type()}: ${message.text()}`); });
  iframePage.on("pageerror", (error) => pageErrors.push(error.message));
  await iframePage.goto(`${url}.testbed/scenes/aero-visual-test-transport.scene.html`, { waitUntil: "networkidle" });
  await iframePage.evaluate((sourceUrl) => {
    document.body.replaceChildren();
    const iframe = document.createElement("iframe");
    iframe.id = "transport-iframe";
    iframe.src = sourceUrl;
    iframe.style.cssText = "border:0;display:block;height:100vh;width:100vw";
    document.body.append(iframe);
  }, `${url}.testbed/scenes/aero-visual-test-transport.scene.html`);
  const iframeHandle = await iframePage.waitForSelector("#transport-iframe");
  const transportFrame = await iframeHandle.contentFrame();
  if (!transportFrame) throw new Error("Responsive transport iframe did not expose a frame.");
  await transportFrame.waitForFunction(() => Boolean(customElements.get("aero-visual-test-transport")));
  const iframeDefault = await transportFrame.evaluate(() => {
    const popover = document.querySelector("aero-visual-test-transport")?.shadowRoot?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, geometry: [rect.width, rect.height, popover.getClientRects().length], overflow: document.body.scrollWidth > document.documentElement.clientWidth };
  });
  assert(iframeDefault?.hidden && iframeDefault.display === "none" && iframeDefault.geometry.every((value) => value === 0) && !iframeDefault.overflow, `Responsive iframe default popover rendered while closed: ${JSON.stringify(iframeDefault)}`);
  await transportFrame.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  const iframeOpen = await transportFrame.evaluate(() => {
    const popover = document.querySelector("aero-visual-test-transport")?.shadowRoot?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, rendered: rect.width > 0 && rect.height > 0 && popover.getClientRects().length > 0 };
  });
  assert(iframeOpen?.hidden === false && iframeOpen.display === "grid" && iframeOpen.rendered, `Responsive iframe popover did not render when opened: ${JSON.stringify(iframeOpen)}`);
  await transportFrame.locator("aero-visual-test-transport button[data-role='volume-toggle']").click();
  const iframeClosed = await transportFrame.evaluate(() => {
    const popover = document.querySelector("aero-visual-test-transport")?.shadowRoot?.querySelector(".volume-popover");
    if (!(popover instanceof HTMLElement)) return null;
    const rect = popover.getBoundingClientRect();
    return { hidden: popover.hidden, display: getComputedStyle(popover).display, geometry: [rect.width, rect.height, popover.getClientRects().length] };
  });
  assert(iframeClosed?.hidden && iframeClosed.display === "none" && iframeClosed.geometry.every((value) => value === 0), `Responsive iframe popover remained rendered after button close: ${JSON.stringify(iframeClosed)}`);
  await iframeContext.close();

  assert(consoleNoise.length === 0, `Transport validation emitted console noise: ${consoleNoise.join(" | ")}`);
  assert(pageErrors.length === 0, `Transport validation emitted page errors: ${pageErrors.join(" | ")}`);
  console.log("Visual Test transport browser validation passed.");
} finally {
  await browser.close();
  await server.close();
}

/** @param {unknown} condition @param {string} message @returns {asserts condition} */
function assert(condition, message) { if (!condition) throw new Error(message); }
