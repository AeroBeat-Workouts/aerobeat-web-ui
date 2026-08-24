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
  assert(validation.canvas.landmarkCount === "3", "Overlay canvas did not record the current landmark count.");
  assert(validation.video.fitMode === "cover", "Video element did not receive the latest fit mode.");
  assert(validation.video.mirrored === "false", "Video element did not receive the latest mirroring state.");
  assert(validation.video.sourceKind === "live-camera", "Video element did not retain source kind metadata.");
  assert(validation.video.sourceId === "aero.video.live-camera", "Video element did not retain source id metadata.");
  assert(validation.firstSnapshot.fitMode === "contain", "First preview snapshot did not preserve contain fit mode.");
  assert(validation.firstSnapshot.mirrored === true, "First preview snapshot did not preserve mirrored state.");
  assert(validation.secondSnapshot.fitMode === "cover", "Second preview snapshot did not preserve cover fit mode.");
  assert(validation.secondSnapshot.mirrored === false, "Second preview snapshot did not preserve unmirrored state.");

  const overlayCalls = validation.calls.filter((call) => call.type === "overlay" && call.landmarks.length > 0);
  assert(overlayCalls.length >= 2, "Renderer overlay was not called for both pose frames.");
  const firstOverlay = overlayCalls.find((call) => call.options.surface.fitMode === "contain");
  const secondOverlay = overlayCalls.at(-1);
  assert(Boolean(firstOverlay), "Renderer overlay was not called with the first contain surface.");
  assert(firstOverlay.options.surface.fitMode === "contain", "First overlay call did not receive contain fit mode.");
  assert(firstOverlay.options.surface.mirrored === true, "First overlay call did not receive mirrored surface metadata.");
  assert(secondOverlay.options.surface.fitMode === "cover", "Second overlay call did not receive cover fit mode.");
  assert(secondOverlay.options.surface.mirrored === false, "Second overlay call did not receive unmirrored surface metadata.");
  assert(firstOverlay.landmarks[0].x !== secondOverlay.landmarks[0].x, "Renderer overlay landmarks did not update when the pose frame changed.");
  assert(secondOverlay.options.connections.length > 0, "Renderer overlay did not receive skeleton connections.");
  assert(validation.canvas.contentRect.width === 640, "Cover content rect width was not mapped over the visible feed.");
  assert(validation.canvas.contentRect.height === 360, "Cover content rect height was not mapped over the visible feed.");
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
