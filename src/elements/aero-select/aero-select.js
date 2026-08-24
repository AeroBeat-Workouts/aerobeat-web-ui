// @ts-check

/**
 * Public change event dispatched by `aero-select` after option selection.
 *
 * @type {"aero-select-change"}
 */
export const aeroSelectChangeEventName = "aero-select-change";

/**
 * @typedef {object} AeroSelectOption
 * @property {string} value Stable option value.
 * @property {string} label Visible option label.
 */

/**
 * Reusable select control for compact phone-test settings.
 */
export class AeroSelect extends HTMLElement {
  /**
   * Observed attributes for the component.
   *
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ["disabled", "label", "value"];
  }

  /**
   * Creates the select shadow DOM.
   */
  constructor() {
    super();
    /** @type {AeroSelectOption[]} */
    this.options = [];
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          color: var(--aero-color-ink, #103447);
          display: block;
          font-family: var(--aero-font-family, system-ui, sans-serif);
        }

        .field {
          display: grid;
          gap: 4px;
        }

        .label {
          font-size: 0.72rem;
          font-weight: 800;
          line-height: 1.1;
        }

        .control {
          appearance: none;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(218, 246, 255, 0.82)),
            linear-gradient(90deg, transparent calc(100% - 34px), rgba(83, 163, 189, 0.18) calc(100% - 34px));
          border: 1px solid var(--aero-color-border, rgba(53, 141, 175, 0.42));
          border-radius: 8px;
          box-shadow: 0 8px 18px rgba(16, 52, 71, 0.13);
          box-sizing: border-box;
          color: var(--aero-color-ink, #103447);
          font: 750 0.82rem var(--aero-font-family, system-ui, sans-serif);
          inline-size: 100%;
          min-block-size: 36px;
          padding: 8px 34px 8px 10px;
        }

        .select-wrap {
          display: grid;
          position: relative;
        }

        .select-wrap::after {
          block-size: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #245e77;
          content: "";
          inline-size: 0;
          inset-block-start: 50%;
          inset-inline-end: 12px;
          pointer-events: none;
          position: absolute;
          transform: translateY(-35%);
        }

        :host([disabled]) .control {
          cursor: not-allowed;
          opacity: 0.58;
        }
      </style>
      <label class="field">
        <span class="label"></span>
        <span class="select-wrap">
          <select class="control" part="control"></select>
        </span>
      </label>
    `;
    this.#selectElement().addEventListener("change", () => this.#dispatchChange());
  }

  /**
   * Syncs attributes and options.
   */
  connectedCallback() {
    this.#render();
  }

  /**
   * Syncs attributes and options.
   */
  attributeChangedCallback() {
    this.#render();
  }

  /**
   * Replaces the available option set.
   *
   * @param {readonly AeroSelectOption[]} options
   * @returns {void}
   */
  setOptions(options) {
    this.options = options.map((option) => ({
      value: option.value,
      label: option.label
    }));
    this.#render();
  }

  /**
   * @returns {string}
   */
  get value() {
    return this.#selectElement().value;
  }

  /**
   * @param {string} value
   */
  set value(value) {
    this.setAttribute("value", value);
  }

  /**
   * @returns {HTMLSelectElement}
   */
  #selectElement() {
    const select = this.shadowRoot?.querySelector("select.control");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("Aero select control is unavailable.");
    }
    return select;
  }

  /**
   * @returns {void}
   */
  #render() {
    const label = this.shadowRoot?.querySelector(".label");
    if (label) {
      label.textContent = this.getAttribute("label") ?? "Select";
    }
    const select = this.#selectElement();
    const targetValue = this.getAttribute("value") ?? select.value;
    select.disabled = this.hasAttribute("disabled");
    select.replaceChildren(...this.options.map((option) => {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      return element;
    }));
    if (this.options.some((option) => option.value === targetValue)) {
      select.value = targetValue;
    }
  }

  /**
   * @returns {void}
   */
  #dispatchChange() {
    const select = this.#selectElement();
    this.setAttribute("value", select.value);
    this.dispatchEvent(new CustomEvent(aeroSelectChangeEventName, {
      bubbles: true,
      composed: true,
      detail: {
        value: select.value,
        label: select.selectedOptions[0]?.textContent ?? select.value
      }
    }));
  }
}

/**
 * Defines `aero-select` when it is not already registered.
 *
 * @returns {void}
 */
export function defineAeroSelect() {
  if (!customElements.get("aero-select")) {
    customElements.define("aero-select", AeroSelect);
  }
}
