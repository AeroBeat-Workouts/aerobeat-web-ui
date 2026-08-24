// @ts-check

/**
 * @typedef {Object} AeroButtonActivateDetail
 * @property {string} label Visible command label when activation occurred.
 */

/**
 * Public command event dispatched by `aero-button` after native activation.
 *
 * @type {"aero-button-activate"}
 */
export const aeroButtonActivateEventName = "aero-button-activate";

/**
 * Frutiger Aero command button Web Component.
 */
export class AeroButton extends HTMLElement {
  /**
   * Observed attributes for the component.
   *
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ["disabled", "label", "variant"];
  }

  /**
   * Creates the button shadow DOM.
   */
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: inline-flex;
        }

        .control {
          align-items: center;
          appearance: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(142, 219, 255, 0.78));
          border: 1px solid rgba(47, 139, 182, 0.52);
          border-radius: var(--aero-radius-control, 8px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 8px 18px rgba(17, 77, 104, 0.18);
          color: var(--aero-color-ink, #103447);
          cursor: pointer;
          display: inline-flex;
          font: 600 0.95rem var(--aero-font-family, system-ui, sans-serif);
          justify-content: center;
          min-height: 36px;
          min-width: 44px;
          padding: 0 var(--aero-space-4, 16px);
        }

        .control:focus-visible {
          outline: 2px solid var(--aero-color-focus, #0a84ff);
          outline-offset: 2px;
        }
      </style>
      <button class="control" part="control" type="button"></button>
    `;
    root.querySelector(".control")?.addEventListener("click", () => {
      this.#dispatchActivateEvent();
    });
  }

  /**
   * Syncs attribute changes into the rendered label.
   */
  connectedCallback() {
    this.#render();
  }

  /**
   * Syncs attribute changes into the rendered label.
   */
  attributeChangedCallback() {
    this.#render();
  }

  /**
   * Updates the visible control text.
   */
  #render() {
    const control = this.shadowRoot?.querySelector("button.control");
    if (control) {
      control.textContent = this.getAttribute("label") ?? "Continue";
      control.disabled = this.hasAttribute("disabled");
    }
  }

  /**
   * Dispatches the public activation event for consumers that avoid private shadow DOM coupling.
   *
   * @returns {void}
   */
  #dispatchActivateEvent() {
    /** @type {AeroButtonActivateDetail} */
    const detail = {
      label: this.getAttribute("label") ?? "Continue"
    };

    this.dispatchEvent(new CustomEvent(aeroButtonActivateEventName, {
      bubbles: true,
      composed: true,
      detail
    }));
  }
}

/**
 * Defines `aero-button` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroButton() {
  if (!customElements.get("aero-button")) {
    customElements.define("aero-button", AeroButton);
  }
}
