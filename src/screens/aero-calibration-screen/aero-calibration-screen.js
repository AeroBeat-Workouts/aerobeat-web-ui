// @ts-check

import { defineAeroMediaPosePreview } from "../../elements/aero-media-pose-preview/aero-media-pose-preview.js";
import { AeroCalibrationBadge, AeroCapabilitiesPanel, AeroGridPlayfield, defineAeroProductPresenters, narrowAeroPresenterSnapshot } from "../../elements/aero-product-presenters.js";

/** @typedef {Readonly<Record<string, unknown>>} AeroCalibrationCompositionSnapshot */

/**
 * Automatic-calibration composition screen. The screen presents snapshots only;
 * camera, pose math, calibration and capability policy stay with their owners.
 */
export class AeroCalibrationScreen extends HTMLElement {
  constructor() {
    super();
    /** @type {AeroCalibrationCompositionSnapshot} */
    this.screenSnapshot = Object.freeze({});
  }

  connectedCallback() {
    defineAeroMediaPosePreview();
    defineAeroProductPresenters();
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.#ensureDom();
    this.#applySnapshot();
  }

  disconnectedCallback() {
    const preview = this.shadowRoot?.querySelector("aero-media-pose-preview");
    if (preview instanceof HTMLElement && "clearPoseFrame" in preview && typeof preview.clearPoseFrame === "function") {
      preview.clearPoseFrame();
    }
  }

  /** @param {AeroCalibrationCompositionSnapshot} snapshot @returns {void} */
  setSnapshot(snapshot) {
    this.screenSnapshot = narrowAeroPresenterSnapshot(snapshot);
    this.#applySnapshot();
  }

  /** @returns {void} */
  #ensureDom() {
    if (!this.shadowRoot || this.shadowRoot.childElementCount > 0) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host { block-size: 100%; box-sizing: border-box; display: block; inline-size: 100%; min-block-size: 0; min-inline-size: 0; }
        .layout { block-size: 100%; display: grid; gap: var(--aero-space-4, 16px); grid-template-columns: minmax(0, 1fr) minmax(18rem, .6fr); inline-size: 100%; padding: var(--aero-space-4, 16px); }
        .preview { min-block-size: 16rem; min-inline-size: 0; position: relative; }
        .preview > aero-media-pose-preview, .preview > aero-grid-playfield { block-size: 100%; inline-size: 100%; inset: 0; position: absolute; }
        .status { align-content: start; display: grid; gap: var(--aero-space-3, 12px); min-inline-size: 0; overflow: auto; }
        @media (max-width: 700px), (max-height: 440px) and (orientation: landscape) { .layout { grid-template-columns: 1fr; grid-template-rows: minmax(12rem, 1fr) auto; padding: 10px; } .status { grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); } }
      </style>
      <section class="layout" part="layout" aria-label="Camera calibration">
        <div class="preview" part="preview"><aero-media-pose-preview></aero-media-pose-preview><aero-grid-playfield></aero-grid-playfield></div>
        <div class="status" part="status"><aero-calibration-badge></aero-calibration-badge><aero-capabilities-panel></aero-capabilities-panel></div>
      </section>`;
  }

  /** @returns {void} */
  #applySnapshot() {
    if (!this.shadowRoot || !this.isConnected) return;
    const calibration = isRecord(this.screenSnapshot.calibration) ? this.screenSnapshot.calibration : Object.freeze({ state: "waiting" });
    const capabilities = isRecord(this.screenSnapshot.capabilities) ? this.screenSnapshot.capabilities : Object.freeze({});
    const grid = isRecord(this.screenSnapshot.grid) ? this.screenSnapshot.grid : Object.freeze({ mode: "calibration", dimmed: true, label: "Retained calibration grid" });
    const badge = this.shadowRoot.querySelector("aero-calibration-badge");
    if (badge instanceof AeroCalibrationBadge) badge.setSnapshot(calibration);
    const capabilityPanel = this.shadowRoot.querySelector("aero-capabilities-panel");
    if (capabilityPanel instanceof AeroCapabilitiesPanel) capabilityPanel.setSnapshot(capabilities);
    const playfield = this.shadowRoot.querySelector("aero-grid-playfield");
    if (playfield instanceof AeroGridPlayfield) playfield.setSnapshot(grid);
  }
}

/** Defines `aero-calibration-screen` idempotently. @returns {void} */
export function defineAeroCalibrationScreen() {
  if (!customElements.get("aero-calibration-screen")) customElements.define("aero-calibration-screen", AeroCalibrationScreen);
}

/** @param {unknown} value @returns {value is Readonly<Record<string, unknown>>} */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
