// @ts-check

import { createBrowserVideoMediaFacade } from "@aerobeat/web-video";
import {
  computeMediaContentRect,
  createAeroWebGl2Renderer
} from "@aerobeat/web-renderer";

/**
 * Pose landmark IDs used for the durable body skeleton overlay.
 *
 * @type {readonly (readonly [number, number])[]}
 */
export const aeroPosePreviewSkeletonConnections = Object.freeze([
  Object.freeze([0, 5]),
  Object.freeze([0, 6]),
  Object.freeze([5, 6]),
  Object.freeze([5, 7]),
  Object.freeze([7, 9]),
  Object.freeze([6, 8]),
  Object.freeze([8, 10])
]);

/**
 * Upper-body pose landmarks visible in the phone calibration checkpoint.
 *
 * @type {ReadonlyMap<string, number>}
 */
const aeroPosePreviewLandmarkIds = new Map([
  ["nose", 0],
  ["left_shoulder", 5],
  ["right_shoulder", 6],
  ["left_elbow", 7],
  ["right_elbow", 8],
  ["left_wrist", 9],
  ["right_wrist", 10]
]);

/**
 * @type {readonly string[]}
 */
const aeroPosePreviewLandmarkOrder = Object.freeze([
  "nose",
  "left_wrist",
  "left_elbow",
  "left_shoulder",
  "right_shoulder",
  "right_elbow",
  "right_wrist"
]);

/**
 * @typedef {"smoother" | "fast"} AeroMediaPosePreviewTrackingProfile
 */

/**
 * Preview tracking profiles for phone readability versus latency checks.
 *
 * @type {Readonly<Record<AeroMediaPosePreviewTrackingProfile, { alpha: number }>>}
 */
const aeroPosePreviewTrackingProfiles = Object.freeze({
  smoother: Object.freeze({ alpha: 0.42 }),
  fast: Object.freeze({ alpha: 1 })
});

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-contracts").AeroPoseRoutingSample} AeroPoseRoutingSample
 * @typedef {import("@aerobeat/web-video").createBrowserVideoMediaFacade} CreateBrowserVideoMediaFacade
 */

/**
 * @typedef {ReturnType<CreateBrowserVideoMediaFacade>} BrowserVideoMediaFacade
 * @typedef {ReturnType<import("@aerobeat/web-renderer").createAeroWebGl2Renderer>} AeroWebGl2Renderer
 */

/**
 * @typedef {"contain" | "cover" | "stretch"} AeroMediaPosePreviewFitMode
 */

/**
 * @typedef {object} AeroMediaPosePreviewSource
 * @property {"live-camera" | "loaded-video" | "replay-video-feed"} kind Source kind owned by `@aerobeat/web-video`.
 * @property {string} sourceId Source identifier.
 * @property {AeroMediaPosePreviewFitMode} fitMode Visible media fit mode.
 * @property {boolean} mirrored Whether the player-facing preview is mirrored.
 */

/**
 * @typedef {AeroMediaPosePreviewSource & {
 *   url: string,
 *   loop: boolean,
 *   autoplay: boolean,
 *   muted: boolean,
 *   startTimeSeconds: number
 * }} AeroMediaPosePreviewVideoSource
 */

/**
 * @typedef {object} AeroMediaPosePreviewSurface
 * @property {string | undefined} sourceKind Current source kind.
 * @property {string | undefined} sourceId Current source identifier.
 * @property {AeroMediaPosePreviewFitMode} fitMode Visible media fit mode.
 * @property {boolean} mirrored Whether the player-facing preview is mirrored.
 * @property {number | undefined} intrinsicWidth Source media width.
 * @property {number | undefined} intrinsicHeight Source media height.
 * @property {number} currentTimeSeconds Current media time.
 */

/**
 * @typedef {object} AeroMediaPosePreviewSnapshot
 * @property {string | undefined} sourceKind Current source kind.
 * @property {string | undefined} sourceId Current source identifier.
 * @property {AeroMediaPosePreviewFitMode} fitMode Visible media fit mode.
 * @property {boolean} mirrored Whether the player-facing preview is mirrored.
 * @property {number} landmarkCount Number of landmarks submitted to the overlay.
 * @property {number} rendererDrawCount Current renderer draw count.
 * @property {AeroMediaPosePreviewTrackingProfile} trackingProfile Active preview smoothing profile.
 * @property {{x: number, y: number, width: number, height: number}} contentRect Fitted content rectangle.
 * @property {number | undefined} mediaPoseDeltaMs Media time minus latest real measurement timestamp, when comparable.
 * @property {number | undefined} presentationTargetDeltaMs Media time minus the routed presentation target, when comparable.
 * @property {import("@aerobeat/web-contracts").AeroPoseSampleProvenance | undefined} poseProvenance Measured or predicted overlay source.
 * @property {number | undefined} measurementTimestampMs Latest real measurement timestamp.
 * @property {number | undefined} predictionHorizonMs Current bounded prediction horizon.
 */

/**
 * @typedef {object} AeroMediaPosePreviewOverlaySurface
 * @property {number} viewportWidth Overlay canvas width.
 * @property {number} viewportHeight Overlay canvas height.
 * @property {number | undefined} intrinsicWidth Source media width.
 * @property {number | undefined} intrinsicHeight Source media height.
 * @property {AeroMediaPosePreviewFitMode} fitMode Visible media fit mode.
 * @property {boolean} mirrored Whether normalized x should be mirrored.
 * @property {{x: number, y: number, width: number, height: number} | undefined} contentRect Explicit fitted media rectangle.
 */

/**
 * @typedef {object} AeroMediaPosePreviewLandmark
 * @property {number} id Stable pose landmark identifier.
 * @property {string} name Stable AeroBeat landmark name.
 * @property {number} x Smoothed normalized horizontal position.
 * @property {number} y Smoothed normalized vertical position.
 * @property {number} v Detector confidence.
 */

/**
 * Web UI presenter that composes a video-owned media surface with the shared
 * WebGL2 renderer overlay path. CV and vendor adapters only provide pose data.
 */
export class AeroMediaPosePreview extends HTMLElement {
  /**
   * Observed attributes for declarative scenes.
   *
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ["fit-mode", "mirrored", "source-id", "source-kind", "tracking-profile"];
  }

  /**
   * Creates the preview shadow DOM.
   */
  constructor() {
    super();
    /** @type {BrowserVideoMediaFacade} */
    this.videoMediaFacade = createBrowserVideoMediaFacade();
    /** @type {AeroWebGl2Renderer} */
    this.renderer = createAeroWebGl2Renderer();
    /** @type {AeroMediaPosePreviewSurface | undefined} */
    this.surface = undefined;
    /** @type {NormalizedPoseFrame | undefined} */
    this.poseFrame = undefined;
    /** @type {AeroPoseRoutingSample | undefined} */
    this.poseRoutingSample = undefined;
    /** @type {Map<string, AeroMediaPosePreviewLandmark>} */
    this.smoothedLandmarks = new Map();
    /** @type {string} */
    this.lastSmoothedFrameKey = "";
    /** @type {string} */
    this.lastSmoothedSourceId = "";
    /** @type {AeroMediaPosePreviewTrackingProfile} */
    this.trackingProfile = "smoother";
    /** @type {ResizeObserver | undefined} */
    this.resizeObserver = undefined;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          aspect-ratio: 16 / 9;
          background: #06151a;
          border: 1px solid var(--aero-color-border, rgba(53, 141, 175, 0.42));
          border-radius: var(--aero-radius-panel, 8px);
          box-shadow: var(--aero-shadow-panel, 0 16px 38px rgba(16, 52, 71, 0.18));
          box-sizing: border-box;
          display: block;
          inline-size: 100%;
          max-inline-size: 720px;
          min-block-size: 180px;
          overflow: hidden;
        }

        .preview {
          block-size: 100%;
          display: grid;
          inline-size: 100%;
          overflow: hidden;
          position: relative;
        }

        video,
        canvas {
          block-size: 100%;
          grid-area: 1 / 1;
          inline-size: 100%;
        }

        video {
          background: #06151a;
        }

        video[data-fit-mode="contain"] {
          object-fit: contain;
        }

        video[data-fit-mode="cover"] {
          object-fit: cover;
        }

        video[data-fit-mode="stretch"] {
          object-fit: fill;
        }

        video[data-mirrored="true"] {
          transform: scaleX(-1);
        }

        canvas {
          pointer-events: none;
          position: relative;
          z-index: 1;
        }
      </style>
      <section class="preview" part="preview">
        <video muted playsinline data-fit-mode="contain" data-mirrored="false"></video>
        <canvas aria-hidden="true"></canvas>
      </section>
    `;
  }

  /**
   * Attaches renderer and size observers when connected.
   */
  connectedCallback() {
    this.#syncAttributesToSurface();
    this.#attachRenderer();
    this.resizeObserver = new ResizeObserver(() => {
      this.#sizeOverlayCanvas();
      this.renderPreview();
    });
    this.resizeObserver.observe(this);
    this.renderPreview();
  }

  /**
   * Releases local observers and renderer attachment.
   */
  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.renderer.detach();
  }

  /**
   * Syncs declarative attributes.
   */
  attributeChangedCallback() {
    this.#syncAttributesToSurface();
    this.renderPreview();
  }

  /**
   * Injects the video facade owned by `@aerobeat/web-video`.
   *
   * @param {BrowserVideoMediaFacade} videoMediaFacade
   * @returns {void}
   */
  setVideoMediaFacade(videoMediaFacade) {
    this.videoMediaFacade = videoMediaFacade;
  }

  /**
   * Injects the WebGL2 overlay renderer owned by `@aerobeat/web-renderer`.
   *
   * @param {AeroWebGl2Renderer} renderer
   * @returns {void}
   */
  setRenderer(renderer) {
    this.renderer.detach();
    this.renderer = renderer;
    this.#attachRenderer();
    this.renderPreview();
  }

  /**
   * Attaches a retained or supplied live camera stream to the media surface.
   *
   * @param {MediaStream | undefined} stream
   * @param {AeroMediaPosePreviewSource | undefined} source
   * @returns {AeroMediaPosePreviewSurface}
   */
  attachCameraStream(stream, source) {
    const surface = this.videoMediaFacade.attachCameraStream(this.#videoElement(), stream, { source });
    this.setSurfaceDescriptor(surface);
    return this.#surfaceSnapshot();
  }

  /**
   * Attaches a loaded video or replay feed descriptor to the media surface.
   *
   * @param {AeroMediaPosePreviewVideoSource} source
   * @returns {AeroMediaPosePreviewSurface}
   */
  attachVideoSource(source) {
    const surface = this.videoMediaFacade.attachVideoSource(this.#videoElement(), source);
    this.setSurfaceDescriptor(surface);
    return this.#surfaceSnapshot();
  }

  /**
   * Updates public surface metadata already described by the video facade.
   *
   * @param {Partial<AeroMediaPosePreviewSurface>} surface
   * @param {{ render?: boolean }} [options]
   * @returns {void}
   */
  setSurfaceDescriptor(surface, options = {}) {
    const previousSurface = this.surface;
    this.surface = normalizeSurface({
      ...this.surface,
      ...surface
    });
    if (hasPresentationSurfaceChanged(previousSurface, this.surface)) {
      this.#resetSmoothingState();
    }
    this.#applySurfaceToMedia();
    if (options.render !== false) {
      this.renderPreview();
    }
  }

  /**
   * Updates the pose frame drawn by the renderer overlay.
   *
   * @param {NormalizedPoseFrame | undefined} poseFrame
   * @param {{ render?: boolean }} [options]
   * @returns {void}
   */
  setPoseFrame(poseFrame, options = {}) {
    const previousSourceId = this.poseRoutingSample?.sourceId ?? this.poseFrame?.sourceId;
    const crossedRoutingBoundary = Boolean(this.poseRoutingSample);
    this.poseRoutingSample = undefined;
    this.poseFrame = poseFrame;
    if (!poseFrame || crossedRoutingBoundary || previousSourceId !== poseFrame.sourceId) {
      this.#resetSmoothingState();
    }
    if (options.render !== false) {
      this.renderPreview();
    }
  }

  /**
   * Updates the overlay from a truthfully tagged gameplay-routing sample without
   * exposing the estimate as measured adapter output.
   *
   * @param {AeroPoseRoutingSample | undefined} sample
   * @param {{ render?: boolean }} [options]
   * @returns {void}
   */
  setPoseRoutingSample(sample, options = {}) {
    const previousSample = this.poseRoutingSample;
    const crossedMeasuredFrameBoundary = Boolean(this.poseFrame);
    this.poseFrame = undefined;
    this.poseRoutingSample = sample;
    if (
      !sample
      || crossedMeasuredFrameBoundary
      || previousSample?.sourceId !== sample.sourceId
      || previousSample?.routeEpoch !== sample.routeEpoch
      || previousSample?.provenance !== sample.provenance
    ) {
      this.#resetSmoothingState();
    }
    if (options.render !== false) {
      this.renderPreview();
    }
  }

  /**
   * Selects how aggressively preview landmarks smooth incoming pose frames.
   *
   * @param {AeroMediaPosePreviewTrackingProfile | string | undefined} profile
   * @returns {void}
   */
  setTrackingProfile(profile) {
    const nextProfile = normalizeTrackingProfile(profile);
    if (nextProfile === this.trackingProfile) {
      return;
    }
    this.trackingProfile = nextProfile;
    this.#resetSmoothingState();
    this.setAttribute("tracking-profile", nextProfile);
    this.renderPreview();
  }

  /**
   * Renders the current pose frame over the current media content rect.
   *
   * @returns {AeroMediaPosePreviewSnapshot}
   */
  renderPreview() {
    this.#sizeOverlayCanvas();
    this.#applySurfaceToMedia();
    this.renderer.clear({ color: [0, 0, 0, 0] });
    const surface = this.#overlaySurface();
    const landmarks = this.#visiblePoseLandmarks();
    const result = this.renderer.renderLandmarkOverlay(landmarks, {
      surface,
      connections: aeroPosePreviewSkeletonConnections,
      minVisibility: 0.25,
      color: [0.24, 0.9, 0.45, 0.95],
      pointSize: 7
    });
    const canvas = this.#canvasElement();
    canvas.dataset.landmarkCount = String(landmarks.length);
    canvas.dataset.rendererDrawCount = String(result.status.drawCount);
    canvas.dataset.trackingProfile = this.trackingProfile;
    canvas.dataset.contentRect = JSON.stringify(computeMediaContentRect(surface));
    canvas.dataset.mediaPoseDeltaMs = String(this.#mediaPoseDeltaMs() ?? "");
    canvas.dataset.presentationTargetDeltaMs = String(this.#presentationTargetDeltaMs() ?? "");
    canvas.dataset.poseProvenance = this.poseRoutingSample?.provenance ?? (this.poseFrame ? "measured" : "");
    canvas.dataset.measurementTimestampMs = String(this.#measurementTimestampMs() ?? "");
    canvas.dataset.predictionHorizonMs = String(this.poseRoutingSample?.predictionHorizonMs ?? (this.poseFrame ? 0 : ""));
    return this.describePreview();
  }

  /**
   * Reports the current preview composition state for validation and assembly.
   *
   * @returns {AeroMediaPosePreviewSnapshot}
   */
  describePreview() {
    const surface = this.#overlaySurface();
    const rendererStatus = this.renderer.describe();
    return {
      sourceKind: this.surface?.sourceKind,
      sourceId: this.surface?.sourceId,
      fitMode: surface.fitMode,
      mirrored: surface.mirrored ?? false,
      landmarkCount: this.#visiblePoseLandmarks().length,
      rendererDrawCount: rendererStatus.drawCount,
      trackingProfile: this.trackingProfile,
      contentRect: computeMediaContentRect(surface),
      mediaPoseDeltaMs: this.#mediaPoseDeltaMs(),
      presentationTargetDeltaMs: this.#presentationTargetDeltaMs(),
      poseProvenance: this.poseRoutingSample?.provenance ?? (this.poseFrame ? "measured" : undefined),
      measurementTimestampMs: this.#measurementTimestampMs(),
      predictionHorizonMs: this.poseRoutingSample?.predictionHorizonMs ?? (this.poseFrame ? 0 : undefined)
    };
  }

  /**
   * @returns {HTMLVideoElement}
   */
  #videoElement() {
    const video = this.shadowRoot?.querySelector("video");
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("Aero media preview video element is unavailable.");
    }
    return video;
  }

  /**
   * @returns {HTMLCanvasElement}
   */
  #canvasElement() {
    const canvas = this.shadowRoot?.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Aero media preview canvas element is unavailable.");
    }
    return canvas;
  }

  /**
   * @returns {void}
   */
  #attachRenderer() {
    if (!this.isConnected) {
      return;
    }
    this.#sizeOverlayCanvas();
    this.renderer.attach(this.#canvasElement(), { alpha: true, antialias: true });
  }

  /**
   * @returns {void}
   */
  #sizeOverlayCanvas() {
    const canvas = this.#canvasElement();
    const rect = this.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.clientWidth || 640));
    const height = Math.max(1, Math.round(rect.height || this.clientHeight || 360));
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  }

  /**
   * @returns {void}
   */
  #syncAttributesToSurface() {
    const previousSurface = this.surface;
    const nextTrackingProfile = normalizeTrackingProfile(this.getAttribute("tracking-profile") ?? this.trackingProfile);
    if (nextTrackingProfile !== this.trackingProfile) {
      this.trackingProfile = nextTrackingProfile;
      this.#resetSmoothingState();
    }
    this.surface = normalizeSurface({
      ...this.surface,
      sourceKind: this.getAttribute("source-kind") ?? this.surface?.sourceKind,
      sourceId: this.getAttribute("source-id") ?? this.surface?.sourceId,
      fitMode: normalizeFitMode(this.getAttribute("fit-mode") ?? this.surface?.fitMode),
      mirrored: this.hasAttribute("mirrored")
        ? this.getAttribute("mirrored") !== "false"
        : this.surface?.mirrored
    });
    if (hasPresentationSurfaceChanged(previousSurface, this.surface)) {
      this.#resetSmoothingState();
    }
    this.#applySurfaceToMedia();
  }

  /**
   * @returns {void}
   */
  #applySurfaceToMedia() {
    const video = this.#videoElement();
    const fitMode = this.surface?.fitMode ?? "contain";
    video.dataset.fitMode = fitMode;
    video.dataset.mirrored = String(this.surface?.mirrored ?? false);
    video.dataset.sourceKind = this.surface?.sourceKind ?? "";
    video.dataset.sourceId = this.surface?.sourceId ?? "";
  }

  /**
   * @returns {AeroMediaPosePreviewOverlaySurface}
   */
  #overlaySurface() {
    const canvas = this.#canvasElement();
    const video = this.#videoElement();
    return {
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
      intrinsicWidth: this.surface?.intrinsicWidth ?? positiveNumberOrUndefined(video.videoWidth),
      intrinsicHeight: this.surface?.intrinsicHeight ?? positiveNumberOrUndefined(video.videoHeight),
      fitMode: this.surface?.fitMode ?? "contain",
      mirrored: this.surface?.mirrored ?? false,
      contentRect: this.#measuredVideoContentRect()
    };
  }

  /**
   * @returns {AeroMediaPosePreviewLandmark[]}
   */
  #visiblePoseLandmarks() {
    const presentation = this.poseRoutingSample ?? this.poseFrame;
    const sourceId = presentation?.sourceId ?? "none";
    const presentationSourceKey = this.poseRoutingSample
      ? `routing:${this.poseRoutingSample.routeEpoch}:${this.poseRoutingSample.provenance}:${sourceId}`
      : `measured-frame:${sourceId}`;
    const frameKey = this.poseRoutingSample
      ? `${presentationSourceKey}:${this.poseRoutingSample.targetTimestampMs}`
      : `${presentationSourceKey}:${this.poseFrame?.timestampMs ?? -1}`;
    if (frameKey !== this.lastSmoothedFrameKey) {
      if (presentationSourceKey !== this.lastSmoothedSourceId) {
        this.smoothedLandmarks = new Map();
      }
      const rawLandmarks = normalizePoseLandmarks(presentation);
      /** @type {Map<string, AeroMediaPosePreviewLandmark>} */
      const nextSmoothed = new Map();
      const smoothingAlpha = aeroPosePreviewTrackingProfiles[this.trackingProfile].alpha;
      for (const landmark of rawLandmarks) {
        const previous = this.smoothedLandmarks.get(landmark.name);
        nextSmoothed.set(landmark.name, previous ? smoothLandmark(previous, landmark, smoothingAlpha) : landmark);
      }
      this.smoothedLandmarks = nextSmoothed;
      this.lastSmoothedFrameKey = frameKey;
      this.lastSmoothedSourceId = presentationSourceKey;
    }
    return aeroPosePreviewLandmarkOrder
      .map((name) => this.smoothedLandmarks.get(name))
      .filter(isPreviewLandmark);
  }

  /**
   * Drops filter history at source, lifecycle, tracking, and provenance boundaries.
   *
   * @returns {void}
   */
  #resetSmoothingState() {
    this.smoothedLandmarks = new Map();
    this.lastSmoothedFrameKey = "";
    this.lastSmoothedSourceId = "";
  }

  /**
   * @returns {{x: number, y: number, width: number, height: number} | undefined}
   */
  #measuredVideoContentRect() {
    const canvas = this.#canvasElement();
    const video = this.#videoElement();
    const canvasRect = canvas.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0 || videoRect.width <= 0 || videoRect.height <= 0) {
      return undefined;
    }
    const fitRect = computeMediaContentRect({
      viewportWidth: videoRect.width,
      viewportHeight: videoRect.height,
      intrinsicWidth: this.surface?.intrinsicWidth ?? positiveNumberOrUndefined(video.videoWidth),
      intrinsicHeight: this.surface?.intrinsicHeight ?? positiveNumberOrUndefined(video.videoHeight),
      fitMode: this.surface?.fitMode ?? "contain",
      mirrored: this.surface?.mirrored ?? false
    });
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    return {
      x: (videoRect.left - canvasRect.left + fitRect.x) * scaleX,
      y: (videoRect.top - canvasRect.top + fitRect.y) * scaleY,
      width: fitRect.width * scaleX,
      height: fitRect.height * scaleY
    };
  }

  /**
   * @returns {number | undefined}
   */
  #mediaPoseDeltaMs() {
    const measurementTimestampMs = this.#measurementTimestampMs();
    if (measurementTimestampMs === undefined || this.surface?.sourceKind !== "live-camera") {
      return undefined;
    }
    const mediaTimeMs = this.surface.currentTimeSeconds * 1000;
    if (!Number.isFinite(mediaTimeMs)) {
      return undefined;
    }
    return Math.round(mediaTimeMs - measurementTimestampMs);
  }

  /**
   * @returns {number | undefined}
   */
  #presentationTargetDeltaMs() {
    if (!this.poseRoutingSample || this.surface?.sourceKind !== "live-camera") {
      return undefined;
    }
    const mediaTimeMs = this.surface.currentTimeSeconds * 1000;
    if (!Number.isFinite(mediaTimeMs) || !Number.isFinite(this.poseRoutingSample.targetTimestampMs)) {
      return undefined;
    }
    return Math.round(mediaTimeMs - this.poseRoutingSample.targetTimestampMs);
  }

  /**
   * @returns {number | undefined}
   */
  #measurementTimestampMs() {
    return this.poseRoutingSample?.measurementTimestampMs ?? this.poseFrame?.timestampMs;
  }

  /**
   * @returns {AeroMediaPosePreviewSurface}
   */
  #surfaceSnapshot() {
    return normalizeSurface(this.surface);
  }
}

/**
 * Defines `aero-media-pose-preview` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroMediaPosePreview() {
  if (!customElements.get("aero-media-pose-preview")) {
    customElements.define("aero-media-pose-preview", AeroMediaPosePreview);
  }
}

/**
 * @param {Partial<AeroMediaPosePreviewSurface> | undefined} surface
 * @returns {AeroMediaPosePreviewSurface}
 */
function normalizeSurface(surface) {
  return {
    sourceKind: surface?.sourceKind,
    sourceId: surface?.sourceId,
    fitMode: normalizeFitMode(surface?.fitMode),
    mirrored: surface?.mirrored ?? false,
    intrinsicWidth: positiveNumberOrUndefined(surface?.intrinsicWidth),
    intrinsicHeight: positiveNumberOrUndefined(surface?.intrinsicHeight),
    currentTimeSeconds: typeof surface?.currentTimeSeconds === "number" ? surface.currentTimeSeconds : 0
  };
}

/**
 * @param {AeroMediaPosePreviewSurface | undefined} previous
 * @param {AeroMediaPosePreviewSurface | undefined} next
 * @returns {boolean}
 */
function hasPresentationSurfaceChanged(previous, next) {
  return previous?.sourceKind !== next?.sourceKind
    || previous?.sourceId !== next?.sourceId
    || previous?.mirrored !== next?.mirrored;
}

/**
 * @param {string | undefined} value
 * @returns {AeroMediaPosePreviewFitMode}
 */
function normalizeFitMode(value) {
  return value === "cover" || value === "stretch" || value === "contain" ? value : "contain";
}

/**
 * @param {string | undefined} value
 * @returns {AeroMediaPosePreviewTrackingProfile}
 */
function normalizeTrackingProfile(value) {
  return value === "fast" ? "fast" : "smoother";
}

/**
 * @param {number | undefined} value
 * @returns {number | undefined}
 */
function positiveNumberOrUndefined(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * @param {NormalizedPoseFrame | AeroPoseRoutingSample | undefined} poseSample
 * @returns {AeroMediaPosePreviewLandmark[]}
 */
function normalizePoseLandmarks(poseSample) {
  /** @type {Map<string, AeroMediaPosePreviewLandmark>} */
  const landmarksByName = new Map();
  for (const landmark of poseSample?.landmarks ?? []) {
    const id = aeroPosePreviewLandmarkIds.get(landmark.name);
    if (id === undefined) {
      continue;
    }
    landmarksByName.set(landmark.name, {
      id,
      name: landmark.name,
      x: landmark.x,
      y: landmark.y,
      v: landmark.confidence
    });
  }
  return aeroPosePreviewLandmarkOrder
    .map((name) => landmarksByName.get(name))
    .filter(isPreviewLandmark);
}

/**
 * @param {AeroMediaPosePreviewLandmark | undefined} landmark
 * @returns {landmark is AeroMediaPosePreviewLandmark}
 */
function isPreviewLandmark(landmark) {
  return Boolean(landmark);
}

/**
 * @param {AeroMediaPosePreviewLandmark} previous
 * @param {AeroMediaPosePreviewLandmark} next
 * @param {number} alpha
 * @returns {AeroMediaPosePreviewLandmark}
 */
function smoothLandmark(previous, next, alpha) {
  return {
    id: next.id,
    name: next.name,
    x: lerp(previous.x, next.x, alpha),
    y: lerp(previous.y, next.y, alpha),
    v: next.v
  };
}

/**
 * @param {number} start
 * @param {number} end
 * @param {number} alpha
 * @returns {number}
 */
function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}
