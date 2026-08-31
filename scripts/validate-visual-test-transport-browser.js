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
    const button = root?.querySelector("button");
    const range = root?.querySelector("input[type='range']");
    const timecode = root?.querySelector("time");
    if (!(host instanceof HTMLElement) || !(button instanceof HTMLButtonElement) || !(range instanceof HTMLInputElement) || !(timecode instanceof HTMLTimeElement)) return null;
    const buttonRect = button.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    const timeRect = timecode.getBoundingClientRect();
    return {
      hidden: host.hidden,
      buttonText: button.textContent,
      buttonName: button.getAttribute("aria-label"),
      rangeValue: range.value,
      rangeMax: range.max,
      rangeText: range.getAttribute("aria-valuetext"),
      timecode: timecode.textContent,
      controlHeights: [buttonRect.height, rangeRect.height],
      order: buttonRect.right <= rangeRect.left && rangeRect.right <= timeRect.left,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      snapshotFrozen: Object.isFrozen(host.transportSnapshot)
    };
  });
  assert(initial !== null && initial.hidden === false, "Active Visual Test transport was hidden.");
  assert(initial.buttonText === "Play" && initial.buttonName === "Play Visual Test", "Paused transport did not expose Play.");
  assert(initial.rangeValue === "65000" && initial.rangeMax === "180000" && initial.rangeText === "01:05" && initial.timecode === "01:05", "Initial range/timecode truth was incorrect.");
  assert(initial.controlHeights.every((height) => height >= 42), "Transport controls are smaller than 42px.");
  assert(initial.order === true, "Play/range/timecode are not ordered left-to-right.");
  assert(initial.reduced === true && initial.snapshotFrozen === true, "Reduced-motion or immutable-state contract failed.");

  await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    if (!host) return;
    const intents = [];
    Reflect.set(window, "__aeroTransportIntents", intents);
    host.addEventListener("aero:ui:intent", (event) => {
      if (!(event instanceof CustomEvent)) return;
      intents.push({ type: event.detail?.type, payload: event.detail?.payload, detailFrozen: Object.isFrozen(event.detail), payloadFrozen: Object.isFrozen(event.detail?.payload) });
    });
  });

  await page.locator("aero-visual-test-transport button").click();
  await page.evaluate(() => document.querySelector("aero-visual-test-transport")?.setSnapshot({ active: true, playing: true, currentMs: 65_000, durationMs: 180_000 }));
  await page.locator("aero-visual-test-transport button").click();
  const playPause = await page.evaluate(() => Reflect.get(window, "__aeroTransportIntents"));
  assert(playPause[0]?.type === "visual-test-play" && Object.keys(playPause[0].payload).length === 0, "Play intent was not empty and exact.");
  assert(playPause[1]?.type === "visual-test-pause" && Object.keys(playPause[1].payload).length === 0, "Pause intent was not empty and exact.");
  assert(playPause.every((intent) => intent.detailFrozen && intent.payloadFrozen), "Transport intents are mutable.");

  const scrub = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    const range = host?.shadowRoot?.querySelector("input[type='range']");
    if (!host || !(range instanceof HTMLInputElement)) return null;
    host.setSnapshot({ active: true, playing: true, currentMs: 65_000, durationMs: 180_000 });
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

  await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    host?.setSnapshot({ active: true, playing: false, currentMs: 10_000, durationMs: 20_000 });
    const range = host?.shadowRoot?.querySelector("input[type='range']");
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
    const mutable = { active: true, playing: false, currentMs: 99_999, durationMs: 12_000 };
    host.setSnapshot(mutable);
    mutable.currentMs = 0;
    const clamped = { hidden: host.hidden, currentMs: host.transportSnapshot.currentMs, text: host.shadowRoot?.querySelector("time")?.textContent };
    host.setSnapshot({ active: false, playing: false, currentMs: 0, durationMs: 12_000 });
    const inactiveHidden = host.hidden;
    let getterCalls = 0;
    const hostile = { active: true, playing: false, currentMs: 1 };
    Object.defineProperty(hostile, "durationMs", { enumerable: true, get() { getterCalls += 1; return 12_000; } });
    host.setSnapshot(hostile);
    return { clamped, inactiveHidden, getterCalls, hostileHidden: host.hidden, exactKeys: Object.keys(host.transportSnapshot).sort().join(",") };
  });
  assert(stateBoundary?.clamped.currentMs === 12_000 && stateBoundary.clamped.text === "00:12", "State did not copy/clamp current time.");
  assert(stateBoundary.inactiveHidden === true, "Transport remained visible outside Visual Test.");
  assert(stateBoundary.getterCalls === 0 && stateBoundary.hostileHidden === true, "Accessor-bearing state was executed or retained.");
  assert(stateBoundary.exactKeys === "active,currentMs,durationMs,playing", "Public transport state has an unexpected field.");

  const lifecycle = await page.evaluate(() => {
    const host = document.querySelector("aero-visual-test-transport");
    if (!host) return null;
    host.setSnapshot({ active: true, playing: false, currentMs: 0, durationMs: 20_000 });
    let count = 0;
    host.addEventListener("aero:ui:intent", () => { count += 1; });
    const detachedButton = host.shadowRoot?.querySelector("button");
    host.remove();
    detachedButton?.click();
    const detachedCount = count;
    document.querySelector("main")?.append(host);
    host.shadowRoot?.querySelector("button")?.click();
    host.setSnapshot({ active: true, playing: false, currentMs: 1_000, durationMs: 20_000 });
    const range = host.shadowRoot?.querySelector("input[type='range']");
    range?.focus();
    host.setSnapshot({ active: true, playing: false, currentMs: 2_000, durationMs: 20_000 });
    return { detachedCount, reconnectCount: count, focusStable: host.shadowRoot?.activeElement === range };
  });
  assert(lifecycle?.detachedCount === 0 && lifecycle.reconnectCount === 1, "Disconnect/reconnect duplicated or retained listeners.");
  assert(lifecycle.focusStable === true, "Snapshot update replaced or blurred the focused timeline.");

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const host = document.querySelector("aero-visual-test-transport");
      if (!(host instanceof HTMLElement)) return null;
      host.style.setProperty("--aero-test-safe-area-bottom", "17px");
      host.style.setProperty("--aero-test-safe-area-left", "13px");
      host.style.setProperty("--aero-test-safe-area-right", "11px");
      host.setSnapshot({ active: true, playing: false, currentMs: 2_000, durationMs: 20_000 });
      const bar = host.shadowRoot?.querySelector(".transport");
      if (!(bar instanceof HTMLElement)) return null;
      const hostRect = host.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      const style = getComputedStyle(bar);
      return { viewportWidth: document.documentElement.clientWidth, bodyWidth: document.body.scrollWidth, hostLeft: hostRect.left, hostRight: hostRect.right, barBottom: barRect.bottom, viewportHeight: innerHeight, paddingBottom: parseFloat(style.paddingBottom), paddingLeft: parseFloat(style.paddingLeft), paddingRight: parseFloat(style.paddingRight) };
    });
    assert(layout !== null && layout.bodyWidth <= layout.viewportWidth && layout.hostLeft >= 0 && layout.hostRight <= layout.viewportWidth + 0.5, `Transport overflowed ${viewport.width}x${viewport.height}.`);
    assert(Math.abs(layout.barBottom - layout.viewportHeight) <= 0.5, `Transport did not stay bottom-aligned at ${viewport.width}x${viewport.height}.`);
    assert(layout.paddingBottom >= 17 && layout.paddingLeft >= 13 && layout.paddingRight >= 11, `Safe-area padding failed at ${viewport.width}x${viewport.height}.`);
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

  assert(consoleNoise.length === 0, `Transport validation emitted console noise: ${consoleNoise.join(" | ")}`);
  assert(pageErrors.length === 0, `Transport validation emitted page errors: ${pageErrors.join(" | ")}`);
  console.log("Visual Test transport browser validation passed.");
} finally {
  await browser.close();
  await server.close();
}

/** @param {unknown} condition @param {string} message @returns {asserts condition} */
function assert(condition, message) { if (!condition) throw new Error(message); }
