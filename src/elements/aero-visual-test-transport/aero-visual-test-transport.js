// @ts-check

import { aeroUiIntentEventName } from "../aero-product-presenters.js";
import {
  defaultVisualTestTransportSnapshot,
  formatVisualTestTimecode,
  normalizeVisualTestTransportSnapshot
} from "./visual-test-transport-contract.js";

/** Public custom-element name. @type {"aero-visual-test-transport"} */
export const aeroVisualTestTransportElementName = "aero-visual-test-transport";

/** @typedef {import("./visual-test-transport-contract.js").AeroVisualTestTransportSnapshot} AeroVisualTestTransportSnapshot */

/**
 * Compact Visual Test-only transport presenter. Media and timeline orchestration stay
 * with the host; this element consumes four bounded scalar fields and emits intents.
 */
export class AeroVisualTestTransport extends HTMLElement {
  constructor() {
    super();
    /** @type {AeroVisualTestTransportSnapshot} */
    this.transportSnapshot = defaultVisualTestTransportSnapshot;
    this.pauseRequestedForScrub = false;
    this.boundClick = (event) => this.handleClick(event);
    this.boundInput = (event) => this.handleInput(event);
    this.boundPointerDown = (event) => this.handlePointerDown(event);
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          box-sizing: border-box;
          color: var(--aero-test-transport-color, #fff);
          display: block;
          font-family: var(--aero-font-family, system-ui, sans-serif);
          inset-block-end: 0;
          inset-inline: 0;
          min-inline-size: 0;
          pointer-events: none;
          position: absolute;
          z-index: 30;
        }
        :host([hidden]) { display: none; }
        *, *::before, *::after { box-sizing: border-box; }
        .transport {
          align-items: center;
          background: var(--aero-test-transport-background, rgba(3, 19, 31, .9));
          border-block-start: 1px solid var(--aero-test-transport-border, rgba(255, 255, 255, .34));
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(72px, auto) minmax(0, 1fr) minmax(5ch, auto);
          inline-size: 100%;
          min-block-size: calc(58px + max(var(--aero-test-safe-area-bottom, 0px), env(safe-area-inset-bottom)));
          padding-block: 8px max(8px, var(--aero-test-safe-area-bottom, 0px), env(safe-area-inset-bottom));
          padding-inline: max(10px, var(--aero-test-safe-area-left, 0px), env(safe-area-inset-left)) max(10px, var(--aero-test-safe-area-right, 0px), env(safe-area-inset-right));
          pointer-events: auto;
        }
        button, input {
          color: inherit;
          font: inherit;
          min-block-size: 42px;
        }
        button {
          background: linear-gradient(180deg, #0a84ff, #086ccf);
          border: 1px solid rgba(255, 255, 255, .8);
          border-radius: 9px;
          cursor: pointer;
          font-weight: 800;
          min-inline-size: 72px;
          padding: 7px 12px;
          touch-action: manipulation;
        }
        input[type="range"] {
          accent-color: var(--aero-color-focus, #72dcff);
          cursor: pointer;
          inline-size: 100%;
          margin: 0;
          min-inline-size: 0;
          padding: 0;
          touch-action: pan-x;
        }
        input[type="range"]:disabled { cursor: not-allowed; opacity: .58; }
        button:focus-visible, input:focus-visible {
          outline: 3px solid var(--aero-color-focus, #72dcff);
          outline-offset: 2px;
        }
        time {
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          justify-self: end;
          min-inline-size: 5ch;
          text-align: end;
          white-space: nowrap;
        }
        @media (max-width: 430px) {
          .transport { gap: 8px; grid-template-columns: minmax(68px, auto) minmax(0, 1fr) minmax(5ch, auto); }
          button { min-inline-size: 68px; padding-inline: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; scroll-behavior: auto !important; transition-duration: .001ms !important; }
        }
      </style>
      <div class="transport" part="transport" role="group" aria-label="Visual Test playback">
        <button part="play-pause-button" type="button" data-role="play-pause">Play</button>
        <input part="timeline" data-role="timeline" type="range" min="0" max="0" step="1" value="0" aria-label="Visual Test position" aria-valuetext="00:00">
        <time part="timecode" data-role="timecode" datetime="PT0S">00:00</time>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot?.addEventListener("click", this.boundClick);
    this.shadowRoot?.addEventListener("input", this.boundInput);
    this.shadowRoot?.addEventListener("pointerdown", this.boundPointerDown);
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.boundClick);
    this.shadowRoot?.removeEventListener("input", this.boundInput);
    this.shadowRoot?.removeEventListener("pointerdown", this.boundPointerDown);
  }

  /** @param {unknown} snapshot */
  setSnapshot(snapshot) {
    this.transportSnapshot = normalizeVisualTestTransportSnapshot(snapshot);
    if (!this.transportSnapshot.playing) this.pauseRequestedForScrub = false;
    this.render();
  }

  /** Updates stable controls without replacing focused range DOM. @returns {void} */
  render() {
    const snapshot = this.transportSnapshot;
    this.toggleAttribute("hidden", !snapshot.active);
    this.setAttribute("aria-hidden", String(!snapshot.active));
    const button = this.shadowRoot?.querySelector("button[data-role='play-pause']");
    if (button instanceof HTMLButtonElement) {
      button.textContent = snapshot.playing ? "Pause" : "Play";
      button.setAttribute("aria-label", snapshot.playing ? "Pause Visual Test" : "Play Visual Test");
      button.setAttribute("aria-pressed", String(snapshot.playing));
    }
    const range = this.shadowRoot?.querySelector("input[data-role='timeline']");
    if (range instanceof HTMLInputElement) {
      range.max = String(snapshot.durationMs);
      range.value = String(snapshot.currentMs);
      range.disabled = snapshot.durationMs <= 0;
      range.setAttribute("aria-valuetext", formatVisualTestTimecode(snapshot.currentMs));
    }
    const timecode = this.shadowRoot?.querySelector("time[data-role='timecode']");
    if (timecode instanceof HTMLTimeElement) {
      timecode.textContent = formatVisualTestTimecode(snapshot.currentMs);
      timecode.dateTime = `PT${Math.floor(snapshot.currentMs / 1000)}S`;
    }
  }

  /** @param {Event} event @returns {void} */
  handleClick(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLButtonElement) || target.dataset.role !== "play-pause") return;
    this.emitIntent(this.transportSnapshot.playing ? "visual-test-pause" : "visual-test-play");
  }

  /** @param {Event} event @returns {void} */
  handlePointerDown(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement && target.dataset.role === "timeline") this.requestPauseForScrub();
  }

  /** @param {Event} event @returns {void} */
  handleInput(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLInputElement) || target.dataset.role !== "timeline") return;
    this.requestPauseForScrub();
    const milliseconds = Math.min(this.transportSnapshot.durationMs, Math.max(0, Math.round(Number(target.value))));
    target.setAttribute("aria-valuetext", formatVisualTestTimecode(milliseconds));
    const timecode = this.shadowRoot?.querySelector("time[data-role='timecode']");
    if (timecode instanceof HTMLTimeElement) {
      timecode.textContent = formatVisualTestTimecode(milliseconds);
      timecode.dateTime = `PT${Math.floor(milliseconds / 1000)}S`;
    }
    this.emitIntent("visual-test-seek", { milliseconds });
  }

  /** @returns {void} */
  requestPauseForScrub() {
    if (!this.transportSnapshot.playing || this.pauseRequestedForScrub) return;
    this.pauseRequestedForScrub = true;
    this.emitIntent("visual-test-pause");
  }

  /** @param {string} type @param {Record<string, number>} [payload] @returns {void} */
  emitIntent(type, payload = {}) {
    const detail = Object.freeze({ type, payload: Object.freeze({ ...payload }) });
    this.dispatchEvent(new CustomEvent(aeroUiIntentEventName, { bubbles: true, composed: true, detail }));
  }
}

/** Defines the Visual Test transport idempotently. @returns {void} */
export function defineAeroVisualTestTransport() {
  if (!customElements.get(aeroVisualTestTransportElementName)) customElements.define(aeroVisualTestTransportElementName, AeroVisualTestTransport);
}

export { defaultVisualTestTransportSnapshot, formatVisualTestTimecode, normalizeVisualTestTransportSnapshot } from "./visual-test-transport-contract.js";
