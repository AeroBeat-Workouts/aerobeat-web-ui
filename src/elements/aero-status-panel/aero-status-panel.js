// @ts-check

/**
 * Status panel for calibration, CV, and input proving scenes.
 */
export class AeroStatusPanel extends HTMLElement {
  /**
   * Observed attributes for the component.
   *
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ["heading", "status"];
  }

  /**
   * Creates the panel shadow DOM.
   */
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .panel {
          background: var(--aero-color-surface, rgba(244, 252, 255, 0.84));
          border: 1px solid var(--aero-color-border, rgba(53, 141, 175, 0.42));
          border-radius: var(--aero-radius-panel, 8px);
          box-shadow: var(--aero-shadow-panel, 0 16px 38px rgba(16, 52, 71, 0.18));
          color: var(--aero-color-ink, #103447);
          display: grid;
          gap: var(--aero-space-2, 8px);
          padding: var(--aero-space-4, 16px);
        }

        .heading {
          font: 700 1rem var(--aero-font-family, system-ui, sans-serif);
        }

        .status {
          font: 500 0.9rem var(--aero-font-family, system-ui, sans-serif);
        }
      </style>
      <section class="panel" part="panel">
        <span class="heading"></span>
        <span class="status"></span>
      </section>
    `;
  }

  /**
   * Syncs attributes into the panel content.
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
   * Updates the visible panel content.
   */
  #render() {
    const heading = this.shadowRoot?.querySelector(".heading");
    const status = this.shadowRoot?.querySelector(".status");
    if (heading) {
      heading.textContent = this.getAttribute("heading") ?? "AeroBeat";
    }
    if (status) {
      status.textContent = this.getAttribute("status") ?? "Ready";
    }
  }
}

/**
 * Defines `aero-status-panel` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroStatusPanel() {
  if (!customElements.get("aero-status-panel")) {
    customElements.define("aero-status-panel", AeroStatusPanel);
  }
}
