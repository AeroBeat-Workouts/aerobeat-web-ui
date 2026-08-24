// @ts-check

import { defineAeroButton } from "../../elements/aero-button/aero-button.js";
import { defineAeroPoseFlowPanel } from "../../elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
import { defineAeroStatusPanel } from "../../elements/aero-status-panel/aero-status-panel.js";

/**
 * Component-only starter calibration screen.
 */
export class AeroCalibrationScreen extends HTMLElement {
  /**
   * Creates the screen shadow DOM.
   */
  constructor() {
    super();
    defineAeroButton();
    defineAeroPoseFlowPanel();
    defineAeroStatusPanel();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          box-sizing: border-box;
          display: grid;
          min-height: 100%;
          padding: var(--aero-space-6, 24px);
          place-items: center;
        }

        .layout {
          display: grid;
          gap: var(--aero-space-4, 16px);
          inline-size: min(100%, 520px);
        }
      </style>
      <div class="layout">
        <aero-status-panel heading="Camera calibration" status="Waiting for live, video, or replay pose feed"></aero-status-panel>
        <aero-pose-flow-panel
          source-id="aero.movenet.replay.basic-upper-body"
          timestamp-ms="0"
          input-summary="boxing straight_left | boxing straight_right | boxing guard_enabled"
        ></aero-pose-flow-panel>
        <aero-button label="Begin calibration"></aero-button>
      </div>
    `;
  }
}

/**
 * Defines `aero-calibration-screen` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroCalibrationScreen() {
  if (!customElements.get("aero-calibration-screen")) {
    customElements.define("aero-calibration-screen", AeroCalibrationScreen);
  }
}
