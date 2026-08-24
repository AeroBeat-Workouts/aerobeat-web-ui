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
  Object.freeze([0, 11]),
  Object.freeze([0, 12]),
  Object.freeze([11, 12]),
  Object.freeze([11, 13]),
  Object.freeze([13, 15]),
  Object.freeze([12, 14]),
  Object.freeze([14, 16]),
  Object.freeze([11, 23]),
  Object.freeze([12, 24]),
  Object.freeze([23, 24]),
  Object.freeze([23, 25]),
  Object.freeze([25, 27]),
  Object.freeze([24, 26]),
  Object.freeze([26, 28])
]);

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
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
 * @property {{x: number, y: number, width: number, height: number}} contentRect Fitted content rectangle.
 */

/**
 * @typedef {object} AeroMediaPosePreviewOverlaySurface
 * @property {number} viewportWidth Overlay canvas width.
 * @property {number} viewportHeight Overlay canvas height.
 * @property {number | undefined} intrinsicWidth Source media width.
 * @property {number | undefined} intrinsicHeight Source media height.
 * @property {AeroMediaPosePreviewFitMode} fitMode Visible media fit mode.
 * @property {boolean} mirrored Whether normalized x should be mirrored.
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
    return ["fit-mode", "mirrored", "source-id", "source-kind"];
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
   * @returns {void}
   */
  setSurfaceDescriptor(surface) {
    this.surface = normalizeSurface({
      ...this.surface,
      ...surface
    });
    this.#applySurfaceToMedia();
    this.renderPreview();
  }

  /**
   * Updates the pose frame drawn by the renderer overlay.
   *
   * @param {NormalizedPoseFrame | undefined} poseFrame
   * @returns {void}
   */
  setPoseFrame(poseFrame) {
    this.poseFrame = poseFrame;
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
    const landmarks = normalizePoseLandmarks(this.poseFrame);
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
    canvas.dataset.contentRect = JSON.stringify(computeMediaContentRect(surface));
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
      landmarkCount: normalizePoseLandmarks(this.poseFrame).length,
      rendererDrawCount: rendererStatus.drawCount,
      contentRect: computeMediaContentRect(surface)
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
    this.surface = normalizeSurface({
      ...this.surface,
      sourceKind: this.getAttribute("source-kind") ?? this.surface?.sourceKind,
      sourceId: this.getAttribute("source-id") ?? this.surface?.sourceId,
      fitMode: normalizeFitMode(this.getAttribute("fit-mode") ?? this.surface?.fitMode),
      mirrored: this.hasAttribute("mirrored")
        ? this.getAttribute("mirrored") !== "false"
        : this.surface?.mirrored
    });
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
      mirrored: this.surface?.mirrored ?? false
    };
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
 * @param {string | undefined} value
 * @returns {AeroMediaPosePreviewFitMode}
 */
function normalizeFitMode(value) {
  return value === "cover" || value === "stretch" || value === "contain" ? value : "contain";
}

/**
 * @param {number | undefined} value
 * @returns {number | undefined}
 */
function positiveNumberOrUndefined(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * @param {NormalizedPoseFrame | undefined} poseFrame
 * @returns {{id: number, x: number, y: number, v: number}[]}
 */
function normalizePoseLandmarks(poseFrame) {
  return (poseFrame?.landmarks ?? []).map((landmark, index) => ({
    id: index,
    x: landmark.x,
    y: landmark.y,
    v: landmark.confidence
  }));
}
