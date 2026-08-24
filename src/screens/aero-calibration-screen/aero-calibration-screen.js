// @ts-check

import { aeroButtonActivateEventName, defineAeroButton } from "../../elements/aero-button/aero-button.js";
import { defineAeroPoseFlowPanel } from "../../elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
import { defineAeroStatusPanel } from "../../elements/aero-status-panel/aero-status-panel.js";

/**
 * @typedef {"waiting" | "active"} AeroCalibrationState
 */

/**
 * @typedef {Object} AeroCalibrationStateChangeDetail
 * @property {AeroCalibrationState} state Visible calibration state.
 * @property {string} status Human-readable calibration status.
 * @property {number} activationCount Number of begin activations in this screen instance.
 */

/**
 * Public calibration screen events for assembly and tests.
 *
 * @type {Readonly<{
 *   start: "aero:calibration:start",
 *   stateChange: "aero:calibration:state-change"
 * }>}
 */
export const aeroCalibrationEventNames = Object.freeze({
  start: "aero:calibration:start",
  stateChange: "aero:calibration:state-change"
});

/**
 * Component-only starter calibration screen.
 */
export class AeroCalibrationScreen extends HTMLElement {
  /**
   * Creates the screen shadow DOM.
   */
  constructor() {
    super();
    /** @type {AeroCalibrationStateChangeDetail} */
    this.state = {
      state: "waiting",
      status: "Waiting for live, video, or replay pose feed",
      activationCount: 0
    };
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
        <aero-status-panel heading="Camera calibration"></aero-status-panel>
        <aero-pose-flow-panel
          source-id="aero.movenet.replay.basic-upper-body"
          timestamp-ms="0"
          input-summary="boxing straight_left | boxing straight_right | boxing guard_enabled"
        ></aero-pose-flow-panel>
        <aero-button label="Begin calibration"></aero-button>
      </div>
    `;
    root.addEventListener(aeroButtonActivateEventName, (event) => {
      this.#handleCalibrationStart(event);
    });
  }

  /**
   * Syncs current state when the element enters a document.
   */
  connectedCallback() {
    this.#render();
  }

  /**
   * @param {Event} event
   * @returns {void}
   */
  #handleCalibrationStart(event) {
    event.stopPropagation();
    this.state = {
      state: "active",
      status: "Calibration active - align your shoulders in the rhythm field",
      activationCount: this.state.activationCount + 1
    };
    this.#render();
    this.#dispatchCalibrationEvent(aeroCalibrationEventNames.start);
    this.#dispatchCalibrationEvent(aeroCalibrationEventNames.stateChange);
  }

  /**
   * @param {string} eventName
   * @returns {void}
   */
  #dispatchCalibrationEvent(eventName) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail: {
        ...this.state
      }
    }));
  }

  /**
   * Updates visible calibration state.
   *
   * @returns {void}
   */
  #render() {
    const statusPanel = this.shadowRoot?.querySelector("aero-status-panel");
    const button = this.shadowRoot?.querySelector("aero-button");
    statusPanel?.setAttribute("status", this.state.status);
    button?.setAttribute(
      "label",
      this.state.state === "active" ? "Calibration running" : "Begin calibration"
    );
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
