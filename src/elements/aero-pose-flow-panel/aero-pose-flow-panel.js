// @ts-check

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 */

/**
 * @typedef {Object} PoseFlowDraftEventView
 * @property {string} mode Gameplay mode.
 * @property {string} eventName Browser event name.
 * @property {string} summary Short event summary.
 */

/**
 * @typedef {Object} PoseFlowPanelState
 * @property {NormalizedPoseFrame | undefined} poseFrame Current normalized pose frame.
 * @property {readonly PoseFlowDraftEventView[]} inputEvents Gameplay-facing draft input events.
 */

/**
 * Proving panel for deterministic pose-frame and input-router runtime state.
 */
export class AeroPoseFlowPanel extends HTMLElement {
  /**
   * Observed attributes for declarative scenes.
   *
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ["source-id", "timestamp-ms", "input-summary"];
  }

  /**
   * Creates the panel shadow DOM.
   */
  constructor() {
    super();
    /** @type {PoseFlowPanelState} */
    this.state = {
      poseFrame: undefined,
      inputEvents: []
    };
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .panel {
          background: var(--aero-color-surface, rgba(244, 252, 255, 0.9));
          border: 1px solid var(--aero-color-border, rgba(53, 141, 175, 0.42));
          border-radius: var(--aero-radius-panel, 8px);
          box-shadow: var(--aero-shadow-panel, 0 16px 38px rgba(16, 52, 71, 0.18));
          color: var(--aero-color-ink, #103447);
          display: grid;
          gap: var(--aero-space-3, 12px);
          padding: var(--aero-space-4, 16px);
        }

        .heading {
          font: 700 1rem var(--aero-font-family, system-ui, sans-serif);
        }

        .grid {
          display: grid;
          gap: var(--aero-space-2, 8px);
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .metric,
        .events {
          border-block-start: 1px solid var(--aero-color-border, rgba(53, 141, 175, 0.28));
          display: grid;
          gap: 4px;
          padding-block-start: var(--aero-space-2, 8px);
        }

        .label {
          font: 700 0.72rem var(--aero-font-family, system-ui, sans-serif);
          text-transform: uppercase;
        }

        .value {
          font: 500 0.9rem var(--aero-font-family, system-ui, sans-serif);
          overflow-wrap: anywhere;
        }

        .events {
          grid-column: 1 / -1;
        }
      </style>
      <section class="panel" part="panel">
        <span class="heading">Runtime pose flow</span>
        <div class="grid">
          <span class="metric">
            <span class="label">Source</span>
            <span class="value source">No frame</span>
          </span>
          <span class="metric">
            <span class="label">Timestamp</span>
            <span class="value timestamp">0 ms</span>
          </span>
          <span class="metric">
            <span class="label">Landmarks</span>
            <span class="value landmarks">0</span>
          </span>
          <span class="metric">
            <span class="label">Input events</span>
            <span class="value event-count">0</span>
          </span>
          <span class="events">
            <span class="label">Draft event data</span>
            <span class="value event-summary">Waiting for replay input</span>
          </span>
        </div>
      </section>
    `;
  }

  /**
   * Syncs state into the shadow DOM.
   */
  connectedCallback() {
    this.#render();
  }

  /**
   * Syncs attributes into the panel content.
   */
  attributeChangedCallback() {
    this.#render();
  }

  /**
   * @param {NormalizedPoseFrame | undefined} poseFrame
   * @returns {void}
   */
  setPoseFrame(poseFrame) {
    this.state = {
      poseFrame,
      inputEvents: this.state.inputEvents
    };
    this.#render();
  }

  /**
   * @param {readonly PoseFlowDraftEventView[]} inputEvents
   * @returns {void}
   */
  setInputEvents(inputEvents) {
    this.state = {
      poseFrame: this.state.poseFrame,
      inputEvents
    };
    this.#render();
  }

  /**
   * @param {PoseFlowPanelState} state
   * @returns {void}
   */
  setProvingState(state) {
    this.state = {
      poseFrame: state.poseFrame,
      inputEvents: [...state.inputEvents]
    };
    this.#render();
  }

  /**
   * Updates visible panel content from state or declarative attributes.
   */
  #render() {
    const poseFrame = this.state.poseFrame;
    const sourceId = poseFrame?.sourceId ?? this.getAttribute("source-id") ?? "No frame";
    const timestampMs = poseFrame?.timestampMs ?? Number(this.getAttribute("timestamp-ms") ?? 0);
    const landmarkCount = poseFrame?.landmarks.length ?? 0;
    const inputEvents = this.state.inputEvents;
    const fallbackSummary = this.getAttribute("input-summary") ?? "Waiting for replay input";
    const eventSummary = inputEvents.length > 0
      ? inputEvents.map((event) => `${event.mode} ${event.summary}`).join(" | ")
      : fallbackSummary;

    this.#setText(".source", sourceId);
    this.#setText(".timestamp", `${timestampMs} ms`);
    this.#setText(".landmarks", String(landmarkCount));
    this.#setText(".event-count", String(inputEvents.length));
    this.#setText(".event-summary", eventSummary);
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @returns {void}
   */
  #setText(selector, text) {
    const target = this.shadowRoot?.querySelector(selector);
    if (target) {
      target.textContent = text;
    }
  }
}

/**
 * Defines `aero-pose-flow-panel` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroPoseFlowPanel() {
  if (!customElements.get("aero-pose-flow-panel")) {
    customElements.define("aero-pose-flow-panel", AeroPoseFlowPanel);
  }
}
