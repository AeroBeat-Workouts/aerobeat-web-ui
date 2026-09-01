// @ts-check

import { aeroUiIntentEventName } from "../aero-product-presenters.js";
import {
  defaultVisualTestTransportSnapshot,
  formatVisualTestTimecode,
  normalizeVisualTestTransportSnapshot,
  snapVisualTestVolume
} from "./visual-test-transport-contract.js";

/** Public custom-element name. @type {"aero-visual-test-transport"} */
export const aeroVisualTestTransportElementName = "aero-visual-test-transport";

/** @typedef {import("./visual-test-transport-contract.js").AeroVisualTestTransportSnapshot} AeroVisualTestTransportSnapshot */

/**
 * Compact Visual Test-only transport presenter. Media and timeline orchestration stay
 * with the host; this element consumes bounded scalar fields and emits intents.
 */
export class AeroVisualTestTransport extends HTMLElement {
  static get observedAttributes() { return ["hidden"]; }

  constructor() {
    super();
    /** @type {AeroVisualTestTransportSnapshot} */
    this.transportSnapshot = defaultVisualTestTransportSnapshot;
    this.pauseRequestedForScrub = false;
    this.volumePopoverOpen = false;
    this.boundClick = (event) => this.handleClick(event);
    this.boundInput = (event) => this.handleInput(event);
    this.boundPointerDown = (event) => this.handlePointerDown(event);
    this.boundDocumentPointerDown = (event) => this.handleOutsideInteraction(event);
    this.boundDocumentClick = (event) => this.handleOutsideInteraction(event);
    this.boundDocumentKeydown = (event) => this.handleDocumentKeydown(event);
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
          grid-template-columns: minmax(72px, auto) minmax(0, 1fr) minmax(5ch, auto) 44px;
          inline-size: 100%;
          min-block-size: calc(58px + max(var(--aero-test-safe-area-bottom, 0px), env(safe-area-inset-bottom)));
          padding-block: 8px max(8px, var(--aero-test-safe-area-bottom, 0px), env(safe-area-inset-bottom));
          padding-inline: max(10px, var(--aero-test-safe-area-left, 0px), env(safe-area-inset-left)) max(10px, var(--aero-test-safe-area-right, 0px), env(safe-area-inset-right));
          pointer-events: auto;
          position: relative;
        }
        button, input { color: inherit; font: inherit; min-block-size: 42px; }
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
        button:focus-visible, input:focus-visible { outline: 3px solid var(--aero-color-focus, #72dcff); outline-offset: 2px; }
        time {
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          justify-self: end;
          min-inline-size: 5ch;
          text-align: end;
          white-space: nowrap;
        }
        .volume-button {
          align-items: center;
          display: inline-flex;
          block-size: 44px;
          inline-size: 44px;
          justify-content: center;
          min-block-size: 44px;
          min-inline-size: 44px;
          padding: 8px;
        }
        .volume-button svg { block-size: 24px; fill: currentColor; inline-size: 24px; pointer-events: none; }
        .volume-popover {
          background: rgba(3, 19, 31, .98);
          border: 1px solid rgba(255, 255, 255, .46);
          border-radius: 12px;
          bottom: calc(100% + 8px);
          box-shadow: 0 10px 30px rgba(0,0,0,.42);
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(54px, 1fr));
          inset-inline-end: max(10px, var(--aero-test-safe-area-right, 0px), env(safe-area-inset-right));
          padding: 10px;
          position: absolute;
          z-index: 1;
        }
        .volume-popover[hidden] { display: none; }
        .volume-control {
          align-items: center;
          display: grid;
          font-size: 12px;
          font-weight: 800;
          gap: 4px;
          justify-items: center;
          min-inline-size: 54px;
        }
        .volume-control output { font-variant-numeric: tabular-nums; }
        input.volume-range {
          appearance: auto;
          block-size: auto;
          direction: rtl;
          height: 120px;
          inline-size: auto;
          min-block-size: 0;
          min-inline-size: 0;
          touch-action: none;
          width: 44px;
          writing-mode: vertical-lr;
        }
        .volume-label { white-space: nowrap; }
        @media (max-width: 430px) {
          .transport { gap: 8px; grid-template-columns: minmax(68px, auto) minmax(0, 1fr) minmax(5ch, auto) 44px; }
          button:not(.volume-button) { min-inline-size: 68px; padding-inline: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; scroll-behavior: auto !important; transition-duration: .001ms !important; }
        }
      </style>
      <div class="transport" part="transport" role="group" aria-label="Visual Test playback">
        <button part="play-pause-button" type="button" data-role="play-pause">Play</button>
        <input part="timeline" data-role="timeline" type="range" min="0" max="0" step="1" value="0" aria-label="Visual Test position" aria-valuetext="00:00">
        <time part="timecode" data-role="timecode" datetime="PT0S">00:00</time>
        <button class="volume-button" part="volume-button" type="button" data-role="volume-toggle" aria-label="Open volume controls" aria-controls="volume-popover" aria-expanded="false">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm11.5.5a3.5 3.5 0 0 1 0 5l1.4 1.4a5.5 5.5 0 0 0 0-7.8l-1.4 1.4zm2.8-2.8a7.5 7.5 0 0 1 0 10.6l1.4 1.4a9.5 9.5 0 0 0 0-13.4l-1.4 1.4z"/></svg>
        </button>
        <div id="volume-popover" class="volume-popover" part="volume-popover" role="dialog" aria-label="Volume controls" hidden>
          <label class="volume-control">
            <output data-role="music-volume-value" for="music-volume">0.5</output>
            <input id="music-volume" class="volume-range" part="music-volume" data-role="music-volume" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Music volume" aria-orientation="vertical" aria-valuetext="0.5">
            <span class="volume-label">Music</span>
          </label>
          <label class="volume-control">
            <output data-role="sound-volume-value" for="sound-volume">0.5</output>
            <input id="sound-volume" class="volume-range" part="sound-volume" data-role="sound-volume" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Sound volume" aria-orientation="vertical" aria-valuetext="0.5">
            <span class="volume-label">Sound</span>
          </label>
        </div>
      </div>
    `;
  }

  /** @param {string} name @param {string | null} oldValue @param {string | null} newValue @returns {void} */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "hidden" && oldValue !== newValue && newValue !== null) this.closeVolumePopover(false);
  }

  connectedCallback() {
    this.shadowRoot?.addEventListener("click", this.boundClick);
    this.shadowRoot?.addEventListener("input", this.boundInput);
    this.shadowRoot?.addEventListener("pointerdown", this.boundPointerDown);
    document.addEventListener("pointerdown", this.boundDocumentPointerDown);
    document.addEventListener("click", this.boundDocumentClick);
    document.addEventListener("keydown", this.boundDocumentKeydown);
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.boundClick);
    this.shadowRoot?.removeEventListener("input", this.boundInput);
    this.shadowRoot?.removeEventListener("pointerdown", this.boundPointerDown);
    document.removeEventListener("pointerdown", this.boundDocumentPointerDown);
    document.removeEventListener("click", this.boundDocumentClick);
    document.removeEventListener("keydown", this.boundDocumentKeydown);
    this.closeVolumePopover(false);
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
    if (!snapshot.active) this.closeVolumePopover(false);
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
    this.renderVolumeControl("music", snapshot.musicVolume);
    this.renderVolumeControl("sound", snapshot.soundVolume);
    this.renderVolumePopoverState();
  }

  /** @param {"music" | "sound"} channel @param {number} volume @returns {void} */
  renderVolumeControl(channel, volume) {
    const formatted = volume.toFixed(1);
    const range = this.shadowRoot?.querySelector(`input[data-role='${channel}-volume']`);
    if (range instanceof HTMLInputElement) {
      range.value = String(volume);
      range.setAttribute("aria-valuenow", String(volume));
      range.setAttribute("aria-valuetext", formatted);
    }
    const output = this.shadowRoot?.querySelector(`output[data-role='${channel}-volume-value']`);
    if (output instanceof HTMLOutputElement) output.value = formatted;
  }

  /** @returns {void} */
  renderVolumePopoverState() {
    const popover = this.shadowRoot?.querySelector("[data-role='volume-popover'], .volume-popover");
    if (popover instanceof HTMLElement) popover.hidden = !this.volumePopoverOpen;
    const button = this.shadowRoot?.querySelector("button[data-role='volume-toggle']");
    if (button instanceof HTMLButtonElement) {
      button.setAttribute("aria-expanded", String(this.volumePopoverOpen));
      button.setAttribute("aria-label", this.volumePopoverOpen ? "Close volume controls" : "Open volume controls");
    }
  }

  /** @returns {void} */
  openVolumePopover() {
    if (!this.transportSnapshot.active || this.volumePopoverOpen) return;
    this.volumePopoverOpen = true;
    this.renderVolumePopoverState();
    const music = this.shadowRoot?.querySelector("input[data-role='music-volume']");
    if (music instanceof HTMLInputElement) music.focus();
  }

  /** @param {boolean} restoreFocus @returns {void} */
  closeVolumePopover(restoreFocus) {
    if (!this.volumePopoverOpen) return;
    this.volumePopoverOpen = false;
    this.renderVolumePopoverState();
    const button = this.shadowRoot?.querySelector("button[data-role='volume-toggle']");
    if (restoreFocus && this.isConnected && !this.hidden && button instanceof HTMLButtonElement) button.focus();
  }

  /** @param {Event} event @returns {void} */
  handleClick(event) {
    const target = event.composedPath().find((entry) => entry instanceof HTMLButtonElement);
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.role === "play-pause") this.emitIntent(this.transportSnapshot.playing ? "visual-test-pause" : "visual-test-play");
    else if (target.dataset.role === "volume-toggle") {
      if (this.volumePopoverOpen) this.closeVolumePopover(true);
      else this.openVolumePopover();
    }
  }

  /** @param {Event} event @returns {void} */
  handlePointerDown(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement && target.dataset.role === "timeline") this.requestPauseForScrub();
  }

  /** @param {Event} event @returns {void} */
  handleInput(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.role === "timeline") {
      this.requestPauseForScrub();
      const milliseconds = Math.min(this.transportSnapshot.durationMs, Math.max(0, Math.round(Number(target.value))));
      target.setAttribute("aria-valuetext", formatVisualTestTimecode(milliseconds));
      const timecode = this.shadowRoot?.querySelector("time[data-role='timecode']");
      if (timecode instanceof HTMLTimeElement) {
        timecode.textContent = formatVisualTestTimecode(milliseconds);
        timecode.dateTime = `PT${Math.floor(milliseconds / 1000)}S`;
      }
      this.emitIntent("visual-test-seek", { milliseconds });
      return;
    }
    const channel = target.dataset.role === "music-volume" ? "music" : target.dataset.role === "sound-volume" ? "sound" : null;
    if (!channel) return;
    const volume = snapVisualTestVolume(Number(target.value));
    if (volume === null) return;
    this.renderVolumeControl(channel, volume);
    this.emitIntent(channel === "music" ? "visual-test-music-volume" : "visual-test-sound-volume", { volume });
  }

  /** @param {Event} event @returns {void} */
  handleOutsideInteraction(event) {
    if (!this.volumePopoverOpen) return;
    const path = event.composedPath();
    const popover = this.shadowRoot?.querySelector(".volume-popover");
    const button = this.shadowRoot?.querySelector("button[data-role='volume-toggle']");
    if ((popover && path.includes(popover)) || (button && path.includes(button))) return;
    this.closeVolumePopover(false);
  }

  /** @param {KeyboardEvent} event @returns {void} */
  handleDocumentKeydown(event) {
    if (event.key !== "Escape" || !this.volumePopoverOpen) return;
    event.preventDefault();
    this.closeVolumePopover(true);
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

export {
  defaultVisualTestTransportSnapshot,
  defaultVisualTestVolume,
  formatVisualTestTimecode,
  normalizeVisualTestTransportSnapshot,
  snapVisualTestVolume,
  visualTestVolumeSnapThreshold,
  visualTestVolumeStep
} from "./visual-test-transport-contract.js";
