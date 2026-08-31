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
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  page.on("console", (message) => {
    if ((message.type() === "warning" || message.type() === "error") && !message.text().includes("GPU stall due to ReadPixels")) {
      consoleNoise.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${url}.testbed/demo/media-pose-preview-validation.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__aeroPreviewValidation));
  const validation = await page.evaluate(() => window.__aeroPreviewValidation);

  assert(validation.canvas.width === 1280, "Overlay canvas width did not match the DPR2 preview width.");
  assert(validation.canvas.height === 720, "Overlay canvas height did not match the DPR2 preview height.");
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
  const secondOverlay = overlayCalls.find((call) => (
    call.options.surface.fitMode === "cover" && call.landmarks[1]?.x === 0.42
  ));
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
  assert(approximatelyEqual(validation.canvas.contentRect.width, 1280), "Cover content rect width was not mapped over the DPR2 feed.");
  assert(approximatelyEqual(validation.canvas.contentRect.height, 720), "Cover content rect height was not mapped over the DPR2 feed.");
  assert(validation.canvas.mediaPoseDeltaMs === "-51", "Default measured preview changed its media/measurement freshness metadata.");
  assert(validation.secondSnapshot.poseProvenance === "measured", "Default setPoseFrame behavior did not remain measured.");
  assert(validation.secondSnapshot.measurementTimestampMs === 1301, "Default measured timestamp compatibility changed.");
  assert(validation.secondSnapshot.predictionHorizonMs === 0, "Default measured behavior exposed a prediction horizon.");
  assert(validation.secondSnapshot.presentationTargetDeltaMs === undefined, "Default measured behavior invented a routing target.");

  assert(validation.predictedSnapshot.poseProvenance === "predicted", "Predicted overlay was not explicitly tagged.");
  assert(validation.predictedSnapshot.measurementTimestampMs === 1301, "Predicted overlay lost its real measurement timestamp.");
  assert(validation.predictedSnapshot.predictionHorizonMs === 59, "Predicted overlay lost its prediction horizon.");
  assert(validation.predictedSnapshot.mediaPoseDeltaMs === -51, "Predicted target incorrectly changed measured freshness.");
  assert(validation.predictedSnapshot.presentationTargetDeltaMs === -110, "Predicted target alignment was not exposed separately.");
  assert(validation.predictedCanvas.poseProvenance === "predicted", "Canvas diagnostics hid predicted provenance.");
  assert(validation.predictedCanvas.measurementTimestampMs === "1301", "Canvas diagnostics hid the measurement timestamp.");
  assert(validation.predictedCanvas.predictionHorizonMs === "59", "Canvas diagnostics hid the prediction horizon.");
  assert(validation.predictedCanvas.mediaPoseDeltaMs === "-51", "Canvas freshness used the prediction target instead of measurement time.");
  assert(validation.predictedCanvas.presentationTargetDeltaMs === "-110", "Canvas target delta was not kept separate from freshness.");

  assert(validation.measuredRoutingSnapshot.poseProvenance === "measured", "Measured routing transition retained predicted provenance.");
  assert(validation.measuredRoutingSnapshot.predictionHorizonMs === 0, "Measured routing transition retained a prediction horizon.");
  assert(validation.measuredRoutingOverlay.landmarks[1].x === 0.12, "Measured/predicted transition reused stale smoothing state.");
  assert(validation.clearedSnapshot.poseProvenance === undefined, "Clearing the routing sample masqueraded as measured output.");
  assert(validation.clearedSnapshot.measurementTimestampMs === undefined, "Clearing retained a stale measurement timestamp.");
  assert(validation.clearedSnapshot.predictionHorizonMs === undefined, "Clearing retained a stale prediction horizon.");
  assert(validation.clearedCanvas.poseProvenance === "", "Clearing retained canvas provenance.");
  assert(validation.clearedCanvas.landmarkCount === "0", "Clearing retained stale overlay landmarks.");

  const resizeCalls = validation.calls.filter((call) => call.type === "resize");
  assert(resizeCalls.some((call) => call.size.widthCssPx === 640 && call.size.heightCssPx === 360 && call.size.devicePixelRatio === 2), "Preview did not delegate exact CSS/DPR2 sizing to the renderer.");
  assert(validation.actual.status.serviceId === "aero.renderer.playcanvas", "Actual preview did not use the PlayCanvas service identity.");
  assert(validation.actual.status.engine === "playcanvas", "Actual preview did not expose the PlayCanvas engine.");
  assert(validation.actual.status.viewportWidth === 1280 && validation.actual.status.viewportHeight === 720, "Actual PlayCanvas preview did not retain DPR2 backing dimensions.");
  assert(validation.actual.capabilities.manualRendering === true && validation.actual.capabilities.secondAnimationFrame === false, "Preview renderer did not remain caller-driven without a second RAF.");
  assert(validation.actual.pixels.nonTransparent > 20 && validation.actual.pixels.partialAlpha > 20, `Actual PlayCanvas overlay pixels were missing: ${JSON.stringify(validation.actual.pixels)}.`);
  assert(validation.actual.stableCanvas === true, "Preview replaced its stable canvas during reconnect.");
  assert(validation.actual.detachedStatus.attached === false, "Preview did not detach PlayCanvas on disconnect.");
  assert(validation.actual.reconnectedStatus.attached === true, "Preview did not reattach PlayCanvas on reconnect.");
  assert(validation.actual.reconnectedPixels.nonTransparent > 20, "Reconnected PlayCanvas overlay did not render pixels.");
  assert(validation.actual.canvas.landmarkCount === "7", "Actual PlayCanvas preview lost landmark diagnostics after reconnect.");
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
