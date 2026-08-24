// @ts-check

import { chromium } from "playwright";
import { rmSync } from "node:fs";
import { createServer } from "vite";

rmSync("node_modules/.vite", { recursive: true, force: true });

const server = await createServer({
  appType: "mpa",
  configFile: false,
  logLevel: "error",
  root: ".",
  server: {
    host: "127.0.0.1",
    port: 0
  }
});

await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
  await server.close();
  throw new Error("Vite did not expose a local validation URL.");
}

/** @type {string[]} */
const consoleNoise = [];
/** @type {string[]} */
const pageErrors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleNoise.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${url}.testbed/demo/media-pose-preview-validation.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__aeroPreviewValidation));
  const validation = await page.evaluate(() => window.__aeroPreviewValidation);

  assert(validation.canvas.width === 640, "Overlay canvas width did not match visible preview width.");
  assert(validation.canvas.height === 360, "Overlay canvas height did not match visible preview height.");
  assert(validation.canvas.landmarkCount === "7", "Overlay canvas did not record the requested landmark subset count.");
  assert(validation.video.fitMode === "cover", "Video element did not receive the latest fit mode.");
  assert(validation.video.mirrored === "false", "Video element did not receive the latest mirroring state.");
  assert(validation.video.sourceKind === "live-camera", "Video element did not retain source kind metadata.");
  assert(validation.video.sourceId === "aero.video.live-camera", "Video element did not retain source id metadata.");
  assert(validation.firstSnapshot.fitMode === "contain", "First preview snapshot did not preserve contain fit mode.");
  assert(validation.firstSnapshot.mirrored === true, "First preview snapshot did not preserve mirrored state.");
  assert(validation.smootherSnapshot.fitMode === "cover", "Smoother preview snapshot did not preserve cover fit mode.");
  assert(validation.smootherSnapshot.mirrored === false, "Smoother preview snapshot did not preserve unmirrored state.");
  assert(validation.smootherSnapshot.trackingProfile === "smoother", "Smoother preview snapshot did not preserve tracking profile.");
  assert(validation.secondSnapshot.fitMode === "cover", "Fast preview snapshot did not preserve cover fit mode.");
  assert(validation.secondSnapshot.mirrored === false, "Fast preview snapshot did not preserve unmirrored state.");
  assert(validation.secondSnapshot.trackingProfile === "fast", "Fast preview snapshot did not preserve tracking profile.");

  const overlayCalls = validation.calls.filter((call) => call.type === "overlay" && call.landmarks.length > 0);
  assert(overlayCalls.length >= 2, "Renderer overlay was not called for both pose frames.");
  const firstOverlay = overlayCalls.find((call) => call.options.surface.fitMode === "contain");
  const smootherOverlay = overlayCalls.find((call) => {
    const wristX = call.landmarks[1]?.x ?? 0;
    return call.options.surface.fitMode === "cover" && wristX > 0.22 && wristX < 0.42;
  });
  const secondOverlay = overlayCalls.at(-1);
  assert(Boolean(firstOverlay), "Renderer overlay was not called with the first contain surface.");
  assert(Boolean(smootherOverlay), "Renderer overlay was not called with the smoother cover surface.");
  assert(Boolean(secondOverlay), "Renderer overlay was not called with the fast cover surface.");
  assert(firstOverlay.options.surface.fitMode === "contain", "First overlay call did not receive contain fit mode.");
  assert(firstOverlay.options.surface.mirrored === true, "First overlay call did not receive mirrored surface metadata.");
  assert(secondOverlay.options.surface.fitMode === "cover", "Second overlay call did not receive cover fit mode.");
  assert(secondOverlay.options.surface.mirrored === false, "Second overlay call did not receive unmirrored surface metadata.");
  assert(firstOverlay.landmarks[0].x !== secondOverlay.landmarks[0].x, "Renderer overlay landmarks did not update when the pose frame changed.");
  assert(secondOverlay.landmarks.length === 7, "Renderer overlay included landmarks beyond the requested testing subset.");
  assert(
    JSON.stringify(secondOverlay.landmarks.map((landmark) => landmark.id)) === JSON.stringify([0, 9, 7, 5, 6, 8, 10]),
    "Renderer overlay did not receive stable MoveNet IDs for the requested testing subset."
  );
  assert(secondOverlay.landmarks[1].x === 0.42, "Fast tracking profile did not use the latest left wrist sample directly.");
  assert(secondOverlay.options.connections.length === 7, "Renderer overlay did not receive the upper-body skeleton connections.");
  assert(
    secondOverlay.options.connections.some((connection) => connection[0] === 0 && connection[1] === 6),
    "Renderer overlay did not connect the nose to the right shoulder."
  );
  assert(validation.canvas.trackingProfile === "fast", "Overlay canvas did not expose the selected tracking profile.");
  assert(approximatelyEqual(validation.canvas.contentRect.width, 640), "Cover content rect width was not mapped over the visible feed.");
  assert(approximatelyEqual(validation.canvas.contentRect.height, 360), "Cover content rect height was not mapped over the visible feed.");
  assert(validation.canvas.mediaPoseDeltaMs === "-51", "Preview did not expose comparable media/pose delta metadata.");
} finally {
  await browser.close();
  await server.close();
}

if (pageErrors.length > 0 || consoleNoise.length > 0) {
  console.error([...pageErrors, ...consoleNoise].join("\n"));
  process.exit(1);
}

console.log(`Media pose preview browser validation passed at ${url}`);

/**
 * @param {boolean} condition
 * @param {string} message
 * @returns {void}
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @param {number} actual
 * @param {number} expected
 * @returns {boolean}
 */
function approximatelyEqual(actual, expected) {
  return Math.abs(actual - expected) < 0.001;
}
