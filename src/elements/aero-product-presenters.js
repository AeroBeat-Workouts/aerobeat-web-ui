// @ts-check

import { conversionRecipeIds, elementNames, hasExactKeys, isPrototypeTuningIdentity, rulesetIds } from "@aerobeat/web-contracts";

/** Public composed UI-intent event name. @type {"aero:ui:intent"} */
export const aeroUiIntentEventName = "aero:ui:intent";

/**
 * @typedef {Object} AeroUiIntentDetail
 * @property {string} type Stable intent type.
 * @property {Readonly<Record<string, string | number | boolean | null>>} payload Serializable metadata only; never files or bytes.
 */

/** @typedef {Readonly<Record<string, unknown>>} AeroPresenterSnapshot */

const sharedStyles = `
  :host { box-sizing: border-box; color: var(--aero-color-ink, #103447); display: block; font-family: var(--aero-font-family, system-ui, sans-serif); min-inline-size: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  .panel { background: linear-gradient(145deg, rgba(255,255,255,.94), rgba(207,241,255,.84)); border: 1px solid var(--aero-color-border, rgba(53,141,175,.42)); border-radius: var(--aero-radius-panel, 14px); box-shadow: 0 10px 28px rgba(16,52,71,.16); display: grid; gap: var(--aero-space-3, 12px); min-inline-size: 0; padding: var(--aero-space-4, 16px); }
  h2, h3, p { margin: 0; }
  h2 { font-size: clamp(1rem, 3.5vw, 1.35rem); }
  h3 { font-size: .94rem; }
  .muted { color: var(--aero-color-muted, #486c7d); font-size: .82rem; min-inline-size: 0; overflow-wrap: anywhere; }
  .row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
  .stack { display: grid; gap: 8px; }
  .control, button, input, select { border: 1px solid var(--aero-color-border, rgba(53,141,175,.5)); border-radius: 8px; color: inherit; font: inherit; min-block-size: 42px; }
  button { background: linear-gradient(180deg, #fff, #bcecff); color: var(--aero-color-ink, #103447); cursor: pointer; font-weight: 750; padding: 8px 13px; touch-action: manipulation; }
  button[aria-pressed="true"], button[role="radio"][aria-checked="true"] { background: linear-gradient(180deg, #0a84ff, #086ccf); border-color: #fff; box-shadow: 0 0 0 3px var(--aero-color-focus, #0a84ff), inset 0 0 0 2px rgba(255,255,255,.72); color: #fff; }
  button[disabled], input[disabled], select[disabled] { cursor: not-allowed; opacity: .55; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid var(--aero-color-focus, #0a84ff); outline-offset: 2px; }
  input, select { background: rgba(255,255,255,.92); inline-size: 100%; padding: 8px 10px; }
  label { display: grid; font-size: .78rem; font-weight: 750; gap: 4px; }
  .live { min-block-size: 1.25em; }
  .pill { background: rgba(43,142,183,.12); border-radius: 999px; display: inline-flex; font-size: .74rem; font-weight: 800; padding: 4px 8px; }
  .error { color: var(--aero-color-error, #9f1d24); }
  .cards { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); }
  .card { background: rgba(255,255,255,.72); border: 1px solid rgba(53,141,175,.3); border-radius: 10px; display: grid; gap: 6px; padding: 10px; text-align: start; }
  .cards > article > .card { inline-size: 100%; }
  .choice-radio { align-items: center; cursor: pointer; display: flex; font-size: 1rem; gap: 10px; min-block-size: 42px; }
  .choice-radio:has(input:checked) { background: rgba(10,132,255,.14); border-color: var(--aero-color-focus, #0a84ff); box-shadow: inset 0 0 0 1px var(--aero-color-focus, #0a84ff); }
  .choice-radio input[type="radio"] { accent-color: var(--aero-color-focus, #0a84ff); block-size: 42px; flex: 0 0 42px; inline-size: 42px; margin: 0 8px 0 0; padding: 0; }
  .card > .choice-radio { border: 1px solid transparent; border-radius: 8px; padding: 0 8px; }
  .choice-copy { display: grid; gap: 4px; min-inline-size: 0; }
  progress { accent-color: var(--aero-color-focus, #0a84ff); inline-size: 100%; }
  .visually-hidden { block-size: 1px; clip: rect(0 0 0 0); clip-path: inset(50%); inline-size: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; }
  :host([compact]) .panel { background: transparent; border: 0; border-radius: 0; box-shadow: none; gap: 8px; padding: 0; }
  :host([compact]) h1, :host([compact]) h2, :host([compact]) h3, :host([compact]) .compact-field-label, :host([compact]) .compact-converter-truth { block-size: 1px; clip: rect(0 0 0 0); clip-path: inset(50%); inline-size: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; }
  :host([compact]) .compact-explanatory, :host([compact]) .compact-identity, :host([compact]) .compact-telemetry, :host([compact]) .muted:not(.live):not(.compact-critical):not(.compact-converter-truth), :host([compact]) .pill:not(.error) { display: none; }
  :host([compact]) .compact-status:not(.error) { block-size: 1px; clip: rect(0 0 0 0); clip-path: inset(50%); inline-size: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; }
  :host([compact]) [part="storage"], :host([compact]) [part="detail"] > p, :host([compact]) .choice-copy > .muted { display: none; }
  :host([compact]) [part="items"] span[role="status"] { block-size: 1px; clip: rect(0 0 0 0); clip-path: inset(50%); inline-size: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; }
  :host([compact]) .cards { grid-template-columns: minmax(0, 1fr); }
  :host([compact]) .card { padding: 8px; }
  :host([compact]) label { gap: 0; }
  :host([compact]) .compact-hide-when-clear { display: none; }
  :host([compact]) .compact-library-choices { display: grid; gap: 6px; }
  :host([compact]) .compact-library-choice { align-items: center; background: rgba(255,255,255,.88); border: 1px solid rgba(53,141,175,.42); border-radius: 10px; cursor: pointer; display: flex; font-size: 1rem; gap: 10px; min-block-size: 42px; padding: 0 10px; }
  :host([compact]) .compact-library-choice:has(input:checked) { background: rgba(10,132,255,.18); border-color: var(--aero-color-focus,#0a84ff); box-shadow: inset 0 0 0 1px var(--aero-color-focus,#0a84ff); }
  :host([compact]) .compact-library-choice input[type="radio"] { accent-color: var(--aero-color-focus,#0a84ff); block-size: 42px; flex: 0 0 42px; inline-size: 42px; margin: 0; padding: 0; }
  :host([compact]) .compact-library-choice span { font-weight: 750; min-inline-size: 0; overflow-wrap: anywhere; }
  :host([compact]) .compact-library-actions { border-block-start: 1px solid rgba(53,141,175,.32); margin-block-start: 2px; padding-block-start: 8px; }
  :host([compact]) .compact-preview-action { inline-size: 100%; }
  :host([compact]) .compact-singleton-field { align-items: center; background: rgba(255,255,255,.88); border: 1px solid rgba(53,141,175,.42); border-radius: 8px; display: grid; gap: 2px; min-block-size: 42px; padding: 5px 10px; }
  :host([compact]) .compact-singleton-field > span { color: var(--aero-color-muted,#486c7d); font-size: .7rem; font-weight: 750; }
  :host([compact]) .compact-singleton-field > output { font-size: .92rem; font-weight: 750; min-inline-size: 0; overflow-wrap: anywhere; }
  @media (max-width: 430px) { .panel { border-radius: 10px; padding: 12px; } .row > button { flex: 1 1 auto; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; } }
`;

/**
 * Presenter base with deferred DOM setup and reconnect-safe delegated listeners.
 */
class AeroPresenterElement extends HTMLElement {
  constructor() {
    super();
    /** @type {AeroPresenterSnapshot} */
    this.presenterSnapshot = Object.freeze({});
    this.boundClick = (event) => this.handleDelegatedClick(event);
    this.boundChange = (event) => this.handleDelegatedChange(event);
    this.boundSubmit = (event) => this.handleDelegatedSubmit(event);
    this.boundKeydown = (event) => this.handleDelegatedKeydown(event);
  }

  /** Boolean compact rendering mode; equivalent to the provider-neutral `[compact]` attribute. @returns {boolean} */
  get compact() { return this.hasAttribute("compact"); }

  /** @param {boolean} value */
  set compact(value) { this.toggleAttribute("compact", value === true); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.shadowRoot?.addEventListener("click", this.boundClick);
    this.shadowRoot?.addEventListener("change", this.boundChange);
    this.shadowRoot?.addEventListener("submit", this.boundSubmit);
    this.shadowRoot?.addEventListener("keydown", this.boundKeydown);
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.boundClick);
    this.shadowRoot?.removeEventListener("change", this.boundChange);
    this.shadowRoot?.removeEventListener("submit", this.boundSubmit);
    this.shadowRoot?.removeEventListener("keydown", this.boundKeydown);
  }

  /** @param {AeroPresenterSnapshot} snapshot */
  setSnapshot(snapshot) {
    this.presenterSnapshot = narrowAeroPresenterSnapshot(snapshot);
    this.render();
  }

  /** @returns {void} */
  render() {}

  /** @param {Event} event @returns {void} */
  handleDelegatedClick(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLElement)) return;
    const type = target.dataset.intent;
    if (!type || target.getAttribute("aria-disabled") === "true" || (target instanceof HTMLButtonElement && target.disabled)) return;
    this.onIntent(type, target);
  }

  /** @param {Event} event @returns {void} */
  handleDelegatedChange(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    const type = target.dataset.intent;
    if (type) this.onIntent(type, target);
  }

  /** @param {Event} event @returns {void} */
  handleDelegatedSubmit(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLFormElement) || target.dataset.form !== "search") return;
    event.preventDefault();
    const input = this.shadowRoot?.querySelector("input[data-field='query']");
    this.emitIntent("beatsaver-search", { query: input instanceof HTMLInputElement ? input.value.trim().slice(0, 256) : "" });
  }

  /** @param {KeyboardEvent} event @returns {void} */
  handleDelegatedKeydown(event) {}

  /** @param {string} type @param {HTMLElement} target @returns {void} */
  onIntent(type, target) {
    const value = target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.value : target.dataset.value ?? "";
    this.emitIntent(type, value === "" ? {} : { value });
  }

  /** @param {string} type @param {Record<string, string | number | boolean | null>} [payload] @returns {void} */
  emitIntent(type, payload = {}) {
    /** @type {AeroUiIntentDetail} */
    const detail = Object.freeze({ type, payload: Object.freeze({ ...payload }) });
    this.dispatchEvent(new CustomEvent(aeroUiIntentEventName, { bubbles: true, composed: true, detail }));
  }

  /** @param {string} markup @returns {void} */
  renderMarkup(markup) {
    if (!this.shadowRoot || !this.isConnected) return;
    const focused = this.shadowRoot.activeElement;
    const focusIdentity = focused instanceof HTMLElement ? Object.freeze({
      intent: focused.dataset.intent ?? "",
      value: focused.dataset.value ?? "",
      field: focused.dataset.field ?? ""
    }) : null;
    this.shadowRoot.innerHTML = `<style>${sharedStyles}</style>${markup}`;
    if (focusIdentity && (focusIdentity.intent || focusIdentity.field)) {
      const controls = this.shadowRoot.querySelectorAll("button,input,select");
      for (const control of controls) {
        if (control instanceof HTMLElement &&
          (control.dataset.intent ?? "") === focusIdentity.intent &&
          (control.dataset.value ?? "") === focusIdentity.value &&
          (control.dataset.field ?? "") === focusIdentity.field) {
          control.focus();
          break;
        }
      }
    }
  }
}

/** BeatSaver discovery, detail, version, difficulty and local-import intent presenter. */
export class AeroBeatSaverBrowser extends AeroPresenterElement {
  static observedAttributes = ["compact"];

  /** Compact changes selected-map choice markup; removing it restores the default presenter exactly. @param {string} name @param {string | null} oldValue @param {string | null} newValue */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "compact" && oldValue !== newValue && this.isConnected) this.render();
  }

  render() {
    const state = readString(this.presenterSnapshot, "state", "idle");
    const query = readString(this.presenterSnapshot, "query", "");
    const results = readRecordList(this.presenterSnapshot, "results").slice(0, 50);
    const selected = readRecord(this.presenterSnapshot, "selectedMap");
    const selectedMapId = selected ? readString(selected, "mapId", "") : "";
    const selectedResultIndex = results.findIndex((result) => readString(result, "mapId", "") === selectedMapId);
    const checkedResultIndex = results.length ? Math.max(0, selectedResultIndex) : -1;
    const versions = readRecordList(this.presenterSnapshot, "versions");
    const difficulties = readStringList(this.presenterSnapshot, "difficulties");
    const selectedVersion = readString(this.presenterSnapshot, "selectedVersionHash", "");
    const selectedDifficulty = readString(this.presenterSnapshot, "selectedDifficulty", "");
    const error = readString(this.presenterSnapshot, "errorMessage", "");
    const busy = state === "loading";
    const detail = selected ? (this.compact ? compactBeatSaverDetailMarkup(selected, versions, difficulties, selectedVersion, selectedDifficulty, previewSnapshot(this.presenterSnapshot)) : defaultBeatSaverDetailMarkup(selected, versions, difficulties, selectedVersion, selectedDifficulty)) : "";
    this.renderMarkup(`
      <section class="panel" part="panel" aria-labelledby="beatsaver-heading">
        <h2 id="beatsaver-heading">Find BeatSaver maps</h2>
        <form class="row" part="search" data-form="search">
          <label style="flex:1 1 14rem"><span class="compact-field-label">Search maps</span><input part="search-input" data-field="query" aria-label="Search maps" value="${escapeAttribute(query)}" autocomplete="off" ${busy ? "disabled" : ""}></label>
          <button part="search-button" type="submit" ${busy ? "disabled" : ""}>Search</button>
          <button part="latest-button" type="button" data-intent="beatsaver-latest" ${busy ? "disabled" : ""}>Latest</button>
          <button part="local-import-button" type="button" data-intent="local-zip-request">Choose local ZIP</button>
        </form>
        <p class="live compact-status ${error ? "error" : "muted"}" role="status" aria-live="polite">${escapeHtml(error || statusText(state, results.length))}</p>
        <div class="cards choice-radios" part="results" role="radiogroup" aria-label="BeatSaver results">
          ${results.map((result, index) => mapResultMarkup(result, index === checkedResultIndex)).join("") || `<p class="muted">${state === "empty" ? "No compatible maps found." : "Search or browse latest maps."}</p>`}
        </div>
        ${detail}
      </section>`);
  }

  /** Map radios commit on `change`; action buttons retain the inherited click path. @param {Event} event */
  handleDelegatedClick(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement && target.type === "radio") return;
    super.handleDelegatedClick(event);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) {
    const selectedMap = readRecord(this.presenterSnapshot, "selectedMap");
    const mapId = selectedMap ? readString(selectedMap, "mapId", "") : "";
    const versionHash = readString(this.presenterSnapshot, "selectedVersionHash", "");
    const difficultyId = readString(this.presenterSnapshot, "selectedDifficulty", "");
    if (type === "beatsaver-select-map") {
      this.emitIntent(type, { mapId: target.dataset.value ?? "" });
      return;
    }
    if (type === "beatsaver-search") {
      const input = this.shadowRoot?.querySelector("input[data-field='query']");
      this.emitIntent(type, { query: input instanceof HTMLInputElement ? input.value.trim() : "" });
      return;
    }
    if (type === "beatsaver-version-select") {
      this.emitIntent(type, { mapId, versionHash: target instanceof HTMLSelectElement ? target.value : "" });
      return;
    }
    if (type === "beatsaver-difficulty-select") {
      this.emitIntent(type, { mapId, versionHash, difficultyId: target instanceof HTMLSelectElement ? target.value : "" });
      return;
    }
    if (type === "beatsaver-preview-toggle") {
      this.emitIntent(type, { mapId, versionHash });
      return;
    }
    if (type === "beatsaver-import") {
      const versionSelect = this.shadowRoot?.querySelector("select[data-intent='beatsaver-version-select']");
      const difficultySelect = this.shadowRoot?.querySelector("select[data-intent='beatsaver-difficulty-select']");
      this.emitIntent(type, {
        mapId,
        versionHash: versionSelect instanceof HTMLSelectElement ? versionSelect.value : versionHash,
        difficultyId: difficultySelect instanceof HTMLSelectElement ? difficultySelect.value : difficultyId
      });
      return;
    }
    this.emitIntent(type);
  }
}

/** Worker conversion progress and cancellation presenter. */
export class AeroContentImportProgress extends AeroPresenterElement {
  render() {
    const state = readString(this.presenterSnapshot, "state", "queued");
    const progress = clamp(readNumber(this.presenterSnapshot, "progress", 0), 0, 1);
    const jobId = readString(this.presenterSnapshot, "jobId", "");
    const error = readString(this.presenterSnapshot, "errorMessage", "");
    const cancellable = !["complete", "cancelled", "failed"].includes(state);
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="import-heading"><h2 id="import-heading">Content import</h2><p class="live ${error ? "error" : ""}" role="status" aria-live="polite">${escapeHtml(error || `${titleCase(state)} · ${Math.round(progress * 100)}%`)}</p><progress part="progress" max="1" value="${progress}" aria-label="Import progress"></progress><button part="cancel-button" type="button" data-intent="content-import-cancel" data-value="${escapeAttribute(jobId)}" ${cancellable ? "" : "disabled"}>Cancel import</button></section>`);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) { this.emitIntent(type, { jobId: target.dataset.value ?? "" }); }
}

/** Locally authored package and quota presenter. */
export class AeroContentLibrary extends AeroPresenterElement {
  static observedAttributes = ["compact"];

  constructor() {
    super();
    this.pendingDeletePackageId = "";
    this.pendingSelectedPackageId = "";
  }

  /** A host snapshot settles any optimistic compact radio selection. @param {AeroPresenterSnapshot} snapshot */
  setSnapshot(snapshot) {
    this.pendingSelectedPackageId = "";
    super.setSnapshot(snapshot);
  }

  /** Compact changes the product composition, while removing it restores the default development markup. @param {string} name @param {string | null} oldValue @param {string | null} newValue */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "compact" && oldValue !== newValue && this.isConnected) this.render();
  }

  render() {
    const packages = readRecordList(this.presenterSnapshot, "packages").slice(0, 100);
    const used = readStorageBytes(this.presenterSnapshot, "usedBytes");
    const quota = readStorageBytes(this.presenterSnapshot, "quotaBytes");
    const error = readString(this.presenterSnapshot, "errorMessage", "");
    const snapshotSelectedPackageId = readString(this.presenterSnapshot, "selectedPackageId", "");
    const selectedPackageId = this.pendingSelectedPackageId && packages.some((item) => readString(item, "packageId", "") === this.pendingSelectedPackageId) ? this.pendingSelectedPackageId : snapshotSelectedPackageId;
    const selectedPackageIndex = packages.findIndex((item) => readString(item, "packageId", "") === selectedPackageId);
    const checkedPackageIndex = packages.length ? Math.max(0, selectedPackageIndex) : -1;
    if (this.pendingDeletePackageId && !packages.some((item) => readString(item, "packageId", "") === this.pendingDeletePackageId)) this.pendingDeletePackageId = "";
    if (this.compact) {
      this.renderMarkup(compactLibraryMarkup(packages, checkedPackageIndex, this.pendingDeletePackageId, error, previewSnapshot(this.presenterSnapshot)));
      return;
    }
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="library-heading"><h2 id="library-heading">My AeroBeat library</h2><p class="muted" part="storage">${escapeHtml(formatStorage(used, quota))}</p>${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}<div class="cards choice-radios" part="items" role="radiogroup" aria-label="Available library packages">${packages.map((item, index) => libraryItemMarkup(item, this.pendingDeletePackageId, index === checkedPackageIndex)).join("") || `<p class="muted">No locally authored packages yet.</p>`}</div></section>`);
  }

  /** Package radios commit on `change`; package actions retain the inherited click path. @param {Event} event */
  handleDelegatedClick(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement && target.type === "radio") return;
    super.handleDelegatedClick(event);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) {
    const packageId = target.dataset.value ?? "";
    if (type === "library-select") {
      this.emitIntent(type, { packageId });
      if (this.compact) {
        this.pendingSelectedPackageId = packageId;
        this.pendingDeletePackageId = "";
        this.render();
        queueMicrotask(() => [...(this.shadowRoot?.querySelectorAll("input[name='library-package-choice']") ?? [])].find((input) => input instanceof HTMLInputElement && input.value === packageId)?.focus());
      }
      return;
    }
    if (type === "library-preview-toggle") {
      this.emitIntent(type, { packageId });
      return;
    }
    if (type === "library-delete-request") {
      this.pendingDeletePackageId = packageId;
      this.render();
      queueMicrotask(() => {
        const confirm = this.shadowRoot?.querySelector("button[data-intent='library-delete']");
        if (confirm instanceof HTMLElement) confirm.focus();
      });
      return;
    }
    if (type === "library-delete-cancel") {
      this.pendingDeletePackageId = "";
      this.render();
      return;
    }
    if (type === "library-delete") {
      this.pendingDeletePackageId = "";
      this.emitIntent(type, { packageId });
      this.render();
      return;
    }
    this.emitIntent(type, { packageId });
  }
}

/** T-pose hold/cooldown/success badge. */
export class AeroCalibrationBadge extends AeroPresenterElement {
  render() {
    const state = readString(this.presenterSnapshot, "state", "waiting");
    const progress = clamp(readNumber(this.presenterSnapshot, "progress", 0), 0, 1);
    const message = readString(this.presenterSnapshot, "message", calibrationMessage(state));
    const calibrationId = readString(this.presenterSnapshot, "calibrationId", "");
    this.renderMarkup(`<section class="panel" part="badge" aria-labelledby="calibration-badge-heading"><div class="row"><h2 id="calibration-badge-heading">T-pose calibration</h2><span class="pill" part="state">${escapeHtml(titleCase(state))}</span></div><p class="live" role="status" aria-live="polite">${escapeHtml(message)}</p><progress part="hold-progress" max="1" value="${progress}" aria-label="T-pose hold progress"></progress><p class="muted">${calibrationId ? `Calibration ${escapeHtml(calibrationId)}` : "Session calibration required"}</p><button part="reset-button" type="button" data-intent="calibration-reset">Reset calibration</button></section>`);
  }
}

/** Renderer-owned surface host for Flow and Spatial Grid. */
export class AeroGridPlayfield extends AeroPresenterElement {
  render() {
    const mode = readString(this.presenterSnapshot, "mode", "flow");
    const dimmed = readBoolean(this.presenterSnapshot, "dimmed", false);
    const label = readString(this.presenterSnapshot, "label", `${titleCase(mode)} playfield`);
    if (!this.shadowRoot?.querySelector(".playfield")) {
      this.renderMarkup(`<section class="playfield" part="playfield"><div class="surface" part="render-surface" data-render-surface></div><div class="receptors" aria-hidden="true">${Array.from({ length: 12 }, (_, index) => `<i data-cell="${index}"></i>`).join("")}</div></section><style>:host{block-size:100%;inline-size:100%;min-block-size:12rem}.playfield{background:linear-gradient(180deg,var(--aero-playfield-background-start,#071426),var(--aero-playfield-background-end,#153b5d));block-size:100%;border-radius:12px;inline-size:100%;overflow:hidden;position:relative}.playfield.dimmed{filter:brightness(.45)}.surface{inset:0;position:absolute}.receptors{display:grid;gap:2%;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);inset:8%;position:absolute}.receptors i{border:1px solid color-mix(in srgb,var(--aero-role-receptor,#d9f5ff) 32%,transparent);border-radius:8px}</style>`);
    }
    const playfield = this.shadowRoot?.querySelector(".playfield");
    if (playfield instanceof HTMLElement) {
      playfield.classList.toggle("dimmed", dimmed);
      playfield.setAttribute("aria-label", label);
    }
  }

  /** @returns {HTMLElement | null} Public renderer attachment surface. */
  getRenderSurface() {
    const surface = this.shadowRoot?.querySelector("[data-render-surface]");
    return surface instanceof HTMLElement ? surface : null;
  }
}

/** Flow HUD presenter. */
export class AeroFlowHud extends AeroPresenterElement {
  render() {
    const score = readNumber(this.presenterSnapshot, "score", 0);
    const combo = readNumber(this.presenterSnapshot, "combo", 0);
    const direction = readString(this.presenterSnapshot, "direction", "—");
    this.renderMarkup(`<section class="panel row" part="hud" aria-label="Flow status"><strong>Flow</strong><span part="score">Score ${score}</span><span part="combo">Combo ${combo}</span><span part="direction">Direction ${escapeHtml(direction)}</span></section>`);
  }
}

/** Semantic two-lane Boxing HUD presenter. */
export class AeroBoxingTrackHud extends AeroPresenterElement {
  render() {
    const left = readString(this.presenterSnapshot, "leftAction", "Ready");
    const right = readString(this.presenterSnapshot, "rightAction", "Ready");
    const defense = readString(this.presenterSnapshot, "defense", "Clear");
    this.renderMarkup(`<section class="tracks" part="hud" aria-label="Semantic Track Boxing"><div class="lane left" part="left-lane"><strong>Athlete left</strong><span>${escapeHtml(left)}</span></div><div class="lane right" part="right-lane"><strong>Athlete right</strong><span>${escapeHtml(right)}</span></div><div class="defense" part="defense-layer">Defense: ${escapeHtml(defense)}</div></section><style>.tracks{display:grid;gap:8px;grid-template-columns:1fr 1fr}.lane,.defense{border-radius:10px;color:var(--aero-role-on-color,#071426);display:grid;gap:4px;min-block-size:64px;padding:12px}.left{background:var(--aero-role-left,#2693ff)}.right{background:var(--aero-role-right,#39c96b)}.defense{background:var(--aero-role-guard,#9a67ea);grid-column:1/-1;min-block-size:auto}</style>`);
  }
}

/** Spatial Grid Boxing HUD presenter. */
export class AeroBoxingSpatialHud extends AeroPresenterElement {
  render() {
    const target = readString(this.presenterSnapshot, "target", "Ready");
    const blockedCells = readNumberList(this.presenterSnapshot, "blockedCells");
    const safeCell = readNumber(this.presenterSnapshot, "safeCell", -1);
    this.renderMarkup(`<section class="panel" part="hud" aria-label="Spatial Grid Boxing"><div class="row"><strong>Spatial Grid</strong><span>${escapeHtml(target)}</span></div><p class="muted">Blocked cells: ${blockedCells.length ? blockedCells.join(", ") : "none"}${safeCell >= 0 ? ` · safe cell ${safeCell}` : ""}</p></section>`);
  }
}

/** Tracking-loss pause presenter. */
export class AeroTrackingPause extends AeroPresenterElement {
  constructor() {
    super();
    this.dialogActive = false;
    /** @type {HTMLElement | null} */
    this.returnFocus = null;
  }

  render() {
    const active = readBoolean(this.presenterSnapshot, "active", false);
    const message = readString(this.presenterSnapshot, "message", "Tracking paused. Recalibrate to continue.");
    const reason = readString(this.presenterSnapshot, "reason", "tracking_lost");
    if (active && !this.dialogActive) this.returnFocus = deepActiveElement();
    const restoreFocus = !active && this.dialogActive ? this.returnFocus : null;
    this.dialogActive = active;
    this.toggleAttribute("hidden", !active);
    this.renderMarkup(`<section class="overlay" part="overlay" role="alertdialog" aria-modal="true" aria-labelledby="tracking-heading" aria-describedby="tracking-message"><h2 id="tracking-heading">Workout paused</h2><p id="tracking-message">${escapeHtml(message)}</p><span class="pill">${escapeHtml(reason)}</span><button part="recalibrate-button" type="button" data-intent="calibration-reset">Recalibrate</button></section><style>:host{inset:0;position:absolute;z-index:20}:host([hidden]){display:none}.overlay{align-content:center;background:rgba(4,17,30,var(--aero-overlay-dim-opacity,.72));block-size:100%;color:#fff;display:grid;gap:14px;inline-size:100%;justify-items:center;padding:24px;text-align:center}</style>`);
    queueMicrotask(() => {
      if (active) {
        const action = this.shadowRoot?.querySelector("button[data-intent='calibration-reset']");
        if (action instanceof HTMLElement) action.focus();
      } else if (restoreFocus?.isConnected) restoreFocus.focus();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.dialogActive && this.returnFocus?.isConnected) this.returnFocus.focus();
  }
}

/** Frozen-time resume countdown presenter. */
export class AeroResumeCountdown extends AeroPresenterElement {
  render() {
    const active = readBoolean(this.presenterSnapshot, "active", false);
    const value = readNumber(this.presenterSnapshot, "value", 3);
    const frozen = readBoolean(this.presenterSnapshot, "frozen", true);
    this.toggleAttribute("hidden", !active);
    this.renderMarkup(`<div class="countdown" part="countdown" role="status" aria-live="assertive" aria-label="Resume countdown ${value}"><strong>${value}</strong><span>${frozen ? "Workout time frozen" : "Get ready"}</span></div><style>:host{display:grid;inset:0;place-items:center;pointer-events:none;position:absolute;z-index:19}:host([hidden]){display:none}.countdown{align-items:center;background:rgba(4,17,30,.82);border-radius:50%;color:#fff;display:grid;inline-size:8rem;justify-items:center;min-block-size:8rem;padding:12px;text-align:center}.countdown strong{font-size:3.6rem;line-height:1}</style>`);
  }
}

/** Cosmetic environment presenter; loading/fallback policy remains outside UI. */
export class AeroBackgroundEnvironment extends AeroPresenterElement {
  render() {
    const label = readString(this.presenterSnapshot, "label", "AeroBeat environment");
    const url = readString(this.presenterSnapshot, "url", "");
    const fallback = readBoolean(this.presenterSnapshot, "fallback", false);
    this.renderMarkup(`<div class="environment" part="environment" role="img" aria-label="${escapeAttribute(label)}"><span class="pill">${fallback ? "Fallback environment" : escapeHtml(label)}</span></div><style>:host{inset:0;position:absolute;z-index:-1}.environment{background:linear-gradient(160deg,var(--aero-playfield-background-start,#071426),var(--aero-playfield-background-end,#153b5d));block-size:100%;inline-size:100%;padding:12px}</style>`);
    const environment = this.shadowRoot?.querySelector(".environment");
    if (environment instanceof HTMLElement && isSafeVisualUrl(url)) environment.style.backgroundImage = `url(${JSON.stringify(url)})`;
  }
}

/** Child-owned fullscreen request presenter. */
export class AeroFullscreenButton extends AeroPresenterElement {
  render() {
    const supported = readBoolean(this.presenterSnapshot, "supported", false);
    const active = readBoolean(this.presenterSnapshot, "active", false);
    const pending = readBoolean(this.presenterSnapshot, "requestPending", false);
    const error = readString(this.presenterSnapshot, "errorCode", "");
    this.renderMarkup(`<div class="stack"><button part="control" type="button" data-intent="${active ? "fullscreen-exit" : "fullscreen-request"}" aria-pressed="${active}" ${supported && !pending ? "" : "disabled"}>${active ? "Exit fullscreen" : "Enter fullscreen"}</button>${error ? `<span class="error" role="status">${escapeHtml(error)}</span>` : ""}</div>`);
  }
}

/** Capability and limitation presenter. */
export class AeroCapabilitiesPanel extends AeroPresenterElement {
  render() {
    const limitations = readStringList(this.presenterSnapshot, "limitations");
    const capabilities = ["camera", "fullscreen", "autoplay", "webgl2", "indexedDb", "worker", "directBeatSaverCors", "localZipImport"];
    this.renderMarkup(`<section class="panel ${limitations.length ? "" : "compact-hide-when-clear"}" part="panel" aria-labelledby="capabilities-heading"><h2 id="capabilities-heading">Device capabilities</h2><div class="cards compact-telemetry">${capabilities.map((name) => `<span class="pill">${escapeHtml(titleCase(name))}: ${readBoolean(this.presenterSnapshot, name, false) ? "available" : "unavailable"}</span>`).join("")}</div>${limitations.length ? `<ul part="limitations" aria-label="Device limitations">${limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="muted">No reported limitations.</p>`}</section>`);
  }
}

/** User-safe error presenter. */
export class AeroErrorPanel extends AeroPresenterElement {
  render() {
    const code = readString(this.presenterSnapshot, "code", "unknown_error");
    const message = readString(this.presenterSnapshot, "message", "An unexpected error occurred.");
    const retryable = readBoolean(this.presenterSnapshot, "retryable", false);
    this.renderMarkup(`<section class="panel" part="panel" role="alert"><h2>Something needs attention</h2><p class="error">${escapeHtml(message)}</p><span class="pill">${escapeHtml(code)}</span>${retryable ? `<button part="retry-button" type="button" data-intent="error-retry">Try again</button>` : ""}</section>`);
  }
}

const prototypeOptions = Object.freeze([
  Object.freeze({ id: "flow", label: "Flow · Grid", productLabel: "Flow", rulesetId: rulesetIds[0], recipeId: "" }),
  Object.freeze({ id: "semantic-row", label: "Semantic Track · Row Family", productLabel: "Semantic Row", rulesetId: rulesetIds[1], recipeId: conversionRecipeIds[0] }),
  Object.freeze({ id: "spatial-row", label: "Spatial Grid · Row Family", productLabel: "Spatial Row", rulesetId: rulesetIds[2], recipeId: conversionRecipeIds[0] }),
  Object.freeze({ id: "semantic-cut", label: "Semantic Track · Cut Family", productLabel: "Semantic Cut", rulesetId: rulesetIds[1], recipeId: conversionRecipeIds[1] }),
  Object.freeze({ id: "spatial-cut", label: "Spatial Grid · Cut Family", productLabel: "Spatial Cut", rulesetId: rulesetIds[2], recipeId: conversionRecipeIds[1] })
]);

const profileClasses = Object.freeze(["live_visual", "between_run_ruleset", "converter_regeneration"]);
const scoringChangeStates = Object.freeze(["idle", "calibrating", "paused_manual", "paused_tracking", "completed", "stopped"]);

/** Flow/four-Boxing prototype and three-class experimental profile presenter. Product embeds may narrow it to Gameplay or Visuals with `[scope]`. */
export class AeroPrototypeSelector extends AeroPresenterElement {
  static get observedAttributes() { return ["scope"]; }

  /** Narrow product view, or the unchanged full development view when omitted. @returns {"gameplay" | "visuals" | "full"} */
  get scope() {
    const value = this.getAttribute("scope");
    return value === "gameplay" || value === "visuals" ? value : "full";
  }

  /** @param {string | null} value */
  set scope(value) {
    if (value === "gameplay" || value === "visuals") this.setAttribute("scope", value);
    else this.removeAttribute("scope");
  }

  /** @returns {void} */
  attributeChangedCallback() { this.render(); }

  /** Atomically accept an exact public profile snapshot; malformed input preserves prior state. @param {AeroPresenterSnapshot} snapshot */
  setSnapshot(snapshot) {
    if (!isPlainRecord(snapshot) || (Object.hasOwn(snapshot, "profileClasses") && !isValidProfilePresenterSnapshot(snapshot))) return;
    super.setSnapshot(snapshot);
  }

  /** Deterministic, immutable host-readable profile state; never a bundle. @returns {Readonly<{selectedProfileId:string,sessionState:string,profileClasses:readonly ProfileClassState[]}>} */
  getProfilePresenterState() {
    const selectedSnapshot = readString(this.presenterSnapshot, "selectedProfileId", "flow");
    return Object.freeze({ selectedProfileId: prototypeOptions.some((option) => option.id === selectedSnapshot) ? selectedSnapshot : "flow", sessionState: readString(this.presenterSnapshot, "sessionState", "idle"), profileClasses: normalizeProfileClassStates(this.presenterSnapshot) });
  }

  render() {
    const selectedSnapshot = readString(this.presenterSnapshot, "selectedProfileId", "flow");
    const selected = prototypeOptions.some((option) => option.id === selectedSnapshot) ? selectedSnapshot : "flow";
    if (this.scope === "gameplay") {
      const options = prototypeOptions.map((option) => Object.freeze({ id: option.id, label: option.productLabel, profileClass: "", profileVersion: "", contentHash: "" }));
      this.renderMarkup(productRadioMarkup("Gameplay", "gameplay-choice", options, Math.max(0, options.findIndex((option) => option.id === selected)), "prototype-select"));
      return;
    }
    if (this.scope === "visuals") {
      const visualState = readRecordList(this.presenterSnapshot, "profileClasses").find((state) => readString(state, "class", "") === "live_visual");
      const active = visualState ? readRecord(visualState, "active") : null;
      const options = visualState ? readRecordList(visualState, "profiles").map((profile) => Object.freeze({ id: readString(profile, "profileId", ""), label: visualProfileLabel(readString(profile, "profileId", "")), profileClass: "live_visual", profileVersion: readString(profile, "profileVersion", ""), contentHash: readString(profile, "contentHash", "") })).filter((option) => option.id !== "") : [];
      const activeIndex = active ? options.findIndex((option) => option.id === readString(active, "profileId", "") && option.profileVersion === readString(active, "profileVersion", "") && option.contentHash === readString(active, "contentHash", "")) : -1;
      this.renderMarkup(productRadioMarkup("Visuals", "visual-choice", options, Math.max(0, activeIndex), "prototype-profile-select"));
      return;
    }
    const sessionState = readString(this.presenterSnapshot, "sessionState", "idle");
    const scoringDisabled = !scoringChangeStates.includes(sessionState);
    const scoringReason = scoringDisabled ? (sessionState === "countdown" ? "Scoring profiles are locked during countdown." : "Pause or finish the run to change scoring profiles.") : "Scoring profile changes apply between runs.";
    const classStates = normalizeProfileClassStates(this.presenterSnapshot);
    const statusText = classStates.length === 3 ? "Visual, scoring, and converter profile state loaded." : "Profile state is incomplete.";
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="profiles-heading"><h2 id="profiles-heading">Workout prototype</h2><div class="cards" part="profiles" role="radiogroup" aria-label="Prototype presentation">${prototypeOptions.map((option) => `<button type="button" part="profile" role="radio" aria-checked="${selected === option.id}" tabindex="${selected === option.id ? "0" : "-1"}" data-intent="prototype-select" data-value="${option.id}"><strong>${escapeHtml(option.label)}</strong><span class="muted">${escapeHtml(option.rulesetId)}${option.recipeId ? ` · ${escapeHtml(option.recipeId)}` : ""}</span></button>`).join("")}</div><p class="muted live compact-status" role="status" aria-live="polite">${escapeHtml(statusText)}</p><section class="stack" part="telemetry" aria-label="Experimental profile management">${classStates.map((state) => profileClassMarkup(state, scoringDisabled, scoringReason)).join("") || `<p class="muted">No valid experimental profile state loaded.</p>`}</section><div class="row" aria-label="Profile bundle actions"><button type="button" part="import-button" data-intent="tuning-import-request" aria-label="Import experimental profile bundle">Import profiles</button><button type="button" part="export-button" data-intent="tuning-export" aria-label="Export experimental profile bundle">Export profiles</button><button type="button" part="reset-button" data-intent="tuning-reset" aria-label="Reset experimental profiles">Reset profiles</button></div></section>`);
  }

  /** Native scoped radios commit on `change`; full-view buttons retain the inherited click path. @param {Event} event */
  handleDelegatedClick(event) {
    const target = event.composedPath()[0];
    if (this.scope !== "full" && target instanceof HTMLInputElement && target.type === "radio") return;
    super.handleDelegatedClick(event);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) {
    if (type === "prototype-select") {
      for (const radio of this.shadowRoot?.querySelectorAll("button[role='radio']") ?? []) {
        if (radio instanceof HTMLButtonElement) {
          const selected = radio === target;
          radio.tabIndex = selected ? 0 : -1;
          radio.setAttribute("aria-checked", selected ? "true" : "false");
        }
      }
      this.emitIntent(type, { profileId: target.dataset.value ?? "" });
    } else if (type === "prototype-profile-select") {
      this.emitIntent(type, { profileClass: target.dataset.profileClass ?? "", profileId: target.dataset.value ?? "", profileVersion: target.dataset.profileVersion ?? "", contentHash: target.dataset.contentHash ?? "" });
    } else this.emitIntent(type);
  }

  /** @param {KeyboardEvent} event */
  handleDelegatedKeydown(event) {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLButtonElement) || target.getAttribute("role") !== "radio") return;
    const radios = [...(this.shadowRoot?.querySelectorAll("button[role='radio']") ?? [])].filter((item) => item instanceof HTMLButtonElement);
    const currentIndex = radios.indexOf(target);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % radios.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + radios.length) % radios.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = radios.length - 1;
    else return;
    event.preventDefault();
    for (const [index, radio] of radios.entries()) {
      radio.tabIndex = index === nextIndex ? 0 : -1;
      radio.setAttribute("aria-checked", index === nextIndex ? "true" : "false");
    }
    const next = radios[nextIndex];
    next.focus();
    this.emitIntent("prototype-select", { profileId: next.dataset.value ?? "" });
  }
}

/** @type {Readonly<Record<string, CustomElementConstructor>>} */
export const aeroProductPresenterConstructors = Object.freeze({
  [elementNames.beatSaverBrowser]: AeroBeatSaverBrowser,
  [elementNames.contentImportProgress]: AeroContentImportProgress,
  [elementNames.contentLibrary]: AeroContentLibrary,
  [elementNames.calibrationBadge]: AeroCalibrationBadge,
  [elementNames.gridPlayfield]: AeroGridPlayfield,
  [elementNames.flowHud]: AeroFlowHud,
  [elementNames.boxingTrackHud]: AeroBoxingTrackHud,
  [elementNames.boxingSpatialHud]: AeroBoxingSpatialHud,
  [elementNames.trackingPause]: AeroTrackingPause,
  [elementNames.countdown]: AeroResumeCountdown,
  [elementNames.prototypeSelector]: AeroPrototypeSelector,
  [elementNames.fullscreenButton]: AeroFullscreenButton,
  "aero-background-environment": AeroBackgroundEnvironment,
  "aero-capabilities-panel": AeroCapabilitiesPanel,
  "aero-error-panel": AeroErrorPanel
});

/** Defines all Task 9 product presenter elements idempotently. @returns {void} */
export function defineAeroProductPresenters() {
  for (const [name, constructor] of Object.entries(aeroProductPresenterConstructors)) {
    if (!customElements.get(name)) customElements.define(name, constructor);
  }
}

/** @param {Readonly<Record<string, unknown>>} record @param {string} key @param {string} fallback @returns {string} */
function readString(record, key, fallback) { const value = record[key]; return typeof value === "string" ? value : fallback; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @param {number} fallback @returns {number} */
function readNumber(record, key, fallback) { const value = record[key]; return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @returns {number} */
function readStorageBytes(record, key) { return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(readNumber(record, key, 0)))); }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @param {boolean} fallback @returns {boolean} */
function readBoolean(record, key, fallback) { const value = record[key]; return typeof value === "boolean" ? value : fallback; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @returns {Readonly<Record<string, unknown>> | null} */
function readRecord(record, key) { const value = record[key]; return isPlainRecord(value) ? value : null; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @returns {Readonly<Record<string, unknown>>[]} */
function readRecordList(record, key) { const value = record[key]; return Array.isArray(value) ? value.filter(isPlainRecord) : []; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @returns {string[]} */
function readStringList(record, key) { const value = record[key]; return Array.isArray(value) ? value.filter((item) => typeof item === "string") : []; }
/** @param {Readonly<Record<string, unknown>>} record @param {string} key @returns {number[]} */
function readNumberList(record, key) { const value = record[key]; return Array.isArray(value) ? value.filter((item) => typeof item === "number" && Number.isFinite(item)) : []; }
/** @param {unknown} value @returns {value is Readonly<Record<string, unknown>>} */
function isPlainRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  try { const prototype = Object.getPrototypeOf(value); return prototype === Object.prototype || prototype === null; } catch { return false; }
}
/** Narrow an external presenter snapshot to immutable JSON-like data. @param {unknown} value @returns {AeroPresenterSnapshot} */
export function narrowAeroPresenterSnapshot(value) {
  const narrowed = narrowSnapshotValue(value, new Set(), 0);
  return isPlainRecord(narrowed) ? narrowed : Object.freeze({});
}
/** @param {unknown} value @param {Set<object>} seen @param {number} depth @returns {unknown} */
function narrowSnapshotValue(value, seen, depth) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 4096);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (depth >= 10 || typeof value !== "object" || value === null || seen.has(value)) return undefined;
  if (Array.isArray(value)) {
    seen.add(value);
    const items = [];
    const length = Math.min(500, value.length);
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor)) continue;
      const narrowed = narrowSnapshotValue(descriptor.value, seen, depth + 1);
      if (narrowed !== undefined) items.push(narrowed);
    }
    seen.delete(value);
    return Object.freeze(items);
  }
  if (!isPlainRecord(value)) return undefined;
  seen.add(value);
  /** @type {Record<string, unknown>} */
  const record = {};
  try {
    for (const key of Reflect.ownKeys(value).slice(0, 500)) {
      if (typeof key !== "string") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) continue;
      const narrowed = narrowSnapshotValue(descriptor.value, seen, depth + 1);
      if (narrowed !== undefined) record[key] = narrowed;
    }
  } catch {
    seen.delete(value);
    return undefined;
  }
  seen.delete(value);
  return Object.freeze(record);
}
/** @returns {HTMLElement | null} */
function deepActiveElement() {
  let active = document.activeElement;
  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active instanceof HTMLElement ? active : null;
}
/** @param {string} value @returns {string} */
function escapeHtml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
/** @param {string} value @returns {string} */
function escapeAttribute(value) { return escapeHtml(value).replaceAll("`", "&#96;"); }
/** @param {number} value @param {number} min @param {number} max @returns {number} */
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
/** @param {string} value @returns {string} */
function titleCase(value) { return value.replaceAll(/[_-]/gu, " ").replaceAll(/\b\w/gu, (letter) => letter.toUpperCase()); }
/** @param {string} state @param {number} count @returns {string} */
function statusText(state, count) { if (state === "loading") return "Loading BeatSaver maps…"; if (state === "empty") return "No compatible maps found."; if (count > 0) return `${count} map${count === 1 ? "" : "s"} available.`; return "Search or browse latest maps."; }
/** @param {Readonly<Record<string, unknown>>} result @param {boolean} checked @returns {string} */
function mapResultMarkup(result, checked) { const id = readString(result, "mapId", ""); const name = readString(result, "name", "Untitled map"); const author = readString(result, "songAuthorName", "Unknown artist"); return `<article><label class="card choice-radio" part="result"><input type="radio" name="beatsaver-map-choice" value="${escapeAttribute(id)}" data-intent="beatsaver-select-map" data-value="${escapeAttribute(id)}" ${checked ? "checked" : ""}><span class="choice-copy"><strong>${escapeHtml(name)}</strong><span class="muted">${escapeHtml(author)} · ${escapeHtml(id)}</span></span></label></article>`; }
/** @param {string} value @param {string} label @param {string} selected @returns {string} */
function optionMarkup(value, label, selected) { return `<option value="${escapeAttribute(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`; }
/** @typedef {Readonly<{state:"idle"|"loading"|"playing"|"ended"|"error",mapId:string,versionHash:string,packageId:string,errorMessage:string}>} PreviewSnapshot */

/** Default selected-map markup remains byte-for-byte compatible when compact mode is absent. @param {Readonly<Record<string, unknown>>} selected @param {readonly Readonly<Record<string, unknown>>[]} versions @param {readonly string[]} difficulties @param {string} selectedVersion @param {string} selectedDifficulty @returns {string} */
function defaultBeatSaverDetailMarkup(selected, versions, difficulties, selectedVersion, selectedDifficulty) {
  return `<section class="card" part="detail" aria-label="Selected map"><h3>${escapeHtml(readString(selected, "name", "Selected map"))}</h3><p class="muted">${escapeHtml(readString(selected, "songAuthorName", ""))} · mapped by ${escapeHtml(readString(selected, "levelAuthorName", "Unknown"))}</p>
          <label><span class="compact-field-label">Version</span><select aria-label="Version" part="version-select" data-intent="beatsaver-version-select">${versions.map((version) => optionMarkup(readString(version, "versionHash", ""), readString(version, "label", readString(version, "versionHash", "Version")), selectedVersion)).join("")}</select></label>
          <label><span class="compact-field-label">Difficulty</span><select aria-label="Difficulty" part="difficulty-select" data-intent="beatsaver-difficulty-select">${difficulties.map((difficulty) => optionMarkup(difficulty, difficulty, selectedDifficulty)).join("")}</select></label>
          <button part="import-button" type="button" data-intent="beatsaver-import" ${selectedVersion && selectedDifficulty ? "" : "disabled"}>Import selected map</button></section>`;
}

/** Compact selected-map markup exposes preview and only real choices as select controls. @param {Readonly<Record<string, unknown>>} selected @param {readonly Readonly<Record<string, unknown>>[]} versionRecords @param {readonly string[]} difficultyValues @param {string} selectedVersion @param {string} selectedDifficulty @param {PreviewSnapshot} preview @returns {string} */
function compactBeatSaverDetailMarkup(selected, versionRecords, difficultyValues, selectedVersion, selectedDifficulty, preview) {
  const mapId = readBoundedString(selected, "mapId", "", 256);
  const mapName = readBoundedString(selected, "name", "Selected map", 256);
  const versions = versionRecords.filter((version) => readBoundedString(version, "versionHash", "", 256) !== "");
  const difficulties = difficultyValues.filter((difficulty) => difficulty.length > 0).map((difficulty) => difficulty.slice(0, 128));
  const effectiveVersion = versions.some((version) => readString(version, "versionHash", "") === selectedVersion) ? selectedVersion : readString(versions[0] ?? {}, "versionHash", "");
  const effectiveDifficulty = difficulties.includes(selectedDifficulty) ? selectedDifficulty : difficulties[0] ?? "";
  const exactPreview = preview.mapId === mapId && preview.versionHash === effectiveVersion;
  const previewActive = exactPreview && (preview.state === "loading" || preview.state === "playing");
  const previewError = exactPreview && preview.state === "error" ? preview.errorMessage : "";
  const previewLabel = previewActive ? "Stop" : "Preview";
  const versionField = compactChoiceFieldMarkup("Version", "version-select", "beatsaver-version-select", versions.map((version) => ({ value: readString(version, "versionHash", ""), label: readString(version, "label", readString(version, "versionHash", "Version")) })), effectiveVersion);
  const difficultyField = compactChoiceFieldMarkup("Difficulty", "difficulty-select", "beatsaver-difficulty-select", difficulties.map((difficulty) => ({ value: difficulty, label: difficulty })), effectiveDifficulty);
  return `<section class="card" part="detail" aria-label="Selected map"><h3>${escapeHtml(mapName)}</h3><button class="compact-preview-action" part="preview-button" type="button" data-intent="beatsaver-preview-toggle" aria-label="${previewLabel} ${escapeAttribute(mapName)}" aria-pressed="${previewActive}" aria-busy="${preview.state === "loading" && exactPreview}" ${effectiveVersion ? "" : "disabled"}>${previewLabel}</button>${previewError ? `<p class="error" role="status" aria-live="polite">${escapeHtml(previewError)}</p>` : ""}${versionField}${difficultyField}<button part="import-button" type="button" data-intent="beatsaver-import" ${effectiveVersion && effectiveDifficulty ? "" : "disabled"}>Import selected map</button></section>`;
}

/** @typedef {Readonly<{value:string,label:string}>} CompactChoice */
/** A compact field is static for one value, a native select for real choice, and an error for none. @param {string} label @param {string} part @param {string} intent @param {readonly CompactChoice[]} choices @param {string} selected @returns {string} */
function compactChoiceFieldMarkup(label, part, intent, choices, selected) {
  if (choices.length === 0) return `<p class="error" role="status">${escapeHtml(label)} unavailable.</p>`;
  if (choices.length === 1) return `<div class="compact-singleton-field" part="${escapeAttribute(part)}"><span>${escapeHtml(label)}</span><output aria-label="${escapeAttribute(label)}">${escapeHtml(choices[0].label)}</output></div>`;
  return `<label><span class="compact-field-label">${escapeHtml(label)}</span><select aria-label="${escapeAttribute(label)}" part="${escapeAttribute(part)}" data-intent="${escapeAttribute(intent)}">${choices.map((choice) => optionMarkup(choice.value, choice.label, selected)).join("")}</select></label>`;
}

/** Read bounded scalar preview presentation state only. @param {Readonly<Record<string, unknown>>} snapshot @returns {PreviewSnapshot} */
function previewSnapshot(snapshot) {
  const preview = readRecord(snapshot, "preview") ?? {};
  const rawState = readBoundedString(preview, "state", "idle", 32);
  const state = /** @type {PreviewSnapshot["state"]} */ (["idle", "loading", "playing", "ended", "error"].includes(rawState) ? rawState : "idle");
  return Object.freeze({ state, mapId: readBoundedString(preview, "mapId", "", 256), versionHash: readBoundedString(preview, "versionHash", "", 256), packageId: readBoundedString(preview, "packageId", "", 1024), errorMessage: readBoundedString(preview, "errorMessage", "", 256) });
}

/** @param {Readonly<Record<string, unknown>>} record @param {string} key @param {string} fallback @param {number} maximumLength @returns {string} */
function readBoundedString(record, key, fallback, maximumLength) { return readString(record, key, fallback).slice(0, maximumLength); }

/** Compact quick-choice library using the real persistence-summary shape. @param {readonly Readonly<Record<string, unknown>>[]} packages @param {number} checkedIndex @param {string} pendingDeletePackageId @param {string} error @param {PreviewSnapshot} preview @returns {string} */
function compactLibraryMarkup(packages, checkedIndex, pendingDeletePackageId, error, preview) {
  const usable = packages.map((item, sourceIndex) => ({ item, sourceIndex, id: readString(item, "packageId", ""), base: compactLibraryBaseLabel(item) })).filter((entry) => entry.id !== "");
  const checked = usable.findIndex((entry) => entry.sourceIndex === checkedIndex);
  const checkedUsableIndex = usable.length ? Math.max(0, checked) : -1;
  const totals = new Map();
  for (const entry of usable) totals.set(entry.base, (totals.get(entry.base) ?? 0) + 1);
  const positions = new Map();
  /** @type {string[]} */
  const labels = [];
  const choices = usable.map((entry, index) => {
    const position = (positions.get(entry.base) ?? 0) + 1;
    positions.set(entry.base, position);
    const label = (totals.get(entry.base) ?? 0) > 1 ? `${entry.base} · ${position}` : entry.base;
    labels[index] = label;
    return `<label class="compact-library-choice" part="item"><input type="radio" name="library-package-choice" value="${escapeAttribute(entry.id)}" data-intent="library-select" data-value="${escapeAttribute(entry.id)}" aria-label="Select ${escapeAttribute(label)}" ${index === checkedUsableIndex ? "checked" : ""}><span>${escapeHtml(label)}</span></label>`;
  }).join("");
  const selected = checkedUsableIndex >= 0 ? usable[checkedUsableIndex] : null;
  const actions = selected ? compactLibraryActions(selected.item, pendingDeletePackageId, labels[checkedUsableIndex] ?? selected.base, preview) : "";
  return `<section class="panel compact-library" part="panel" aria-labelledby="library-heading"><h2 id="library-heading">Downloaded songs</h2>${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}<div class="compact-library-choices" part="items" role="radiogroup" aria-label="Downloaded songs">${choices || `<p class="muted compact-critical">No downloaded songs.</p>`}</div>${actions}</section>`;
}

/** @param {Readonly<Record<string, unknown>>} item @returns {string} */
function compactLibraryBaseLabel(item) {
  const songName = readString(item, "songName", readString(item, "name", "Downloaded song"));
  const difficulty = readString(item, "difficulty", "");
  return difficulty ? `${songName} · ${difficulty}` : songName;
}

/** @param {Readonly<Record<string, unknown>>} item @param {string} pendingDeletePackageId @param {string} label @param {PreviewSnapshot} preview @returns {string} */
function compactLibraryActions(item, pendingDeletePackageId, label, preview) {
  const id = readString(item, "packageId", "");
  const accessibleLabel = escapeAttribute(label);
  const pending = id !== "" && id === pendingDeletePackageId;
  const exactPreview = preview.packageId === id;
  const previewActive = exactPreview && (preview.state === "loading" || preview.state === "playing");
  const previewLabel = previewActive ? "Stop" : "Preview";
  const previewError = exactPreview && preview.state === "error" ? preview.errorMessage : "";
  const deleteControls = pending
    ? `<span role="status">Delete ${escapeHtml(label)}?</span><button type="button" aria-label="Confirm delete ${accessibleLabel}" data-intent="library-delete" data-value="${escapeAttribute(id)}">Confirm</button><button type="button" aria-label="Cancel deleting ${accessibleLabel}" data-intent="library-delete-cancel" data-value="${escapeAttribute(id)}">Cancel</button>`
    : `<button type="button" aria-label="Delete ${accessibleLabel}" data-intent="library-delete-request" data-value="${escapeAttribute(id)}">Delete</button>`;
  return `<div class="row compact-library-actions" part="selected-actions" aria-label="Selected song actions"><button class="compact-preview-action" part="preview-button" type="button" aria-label="${previewLabel} ${accessibleLabel}" aria-pressed="${previewActive}" aria-busy="${exactPreview && preview.state === "loading"}" data-intent="library-preview-toggle" data-value="${escapeAttribute(id)}">${previewLabel}</button>${previewError ? `<p class="error" role="status" aria-live="polite">${escapeHtml(previewError)}</p>` : ""}<button type="button" aria-label="Export ${accessibleLabel}" data-intent="library-export" data-value="${escapeAttribute(id)}">Export</button>${deleteControls}</div>`;
}

/** @param {Readonly<Record<string, unknown>>} item @param {string} pendingDeletePackageId @param {boolean} checked @returns {string} */
function libraryItemMarkup(item, pendingDeletePackageId, checked) {
  const id = readString(item, "packageId", "");
  const name = readString(item, "name", "Untitled package");
  const variantCount = readNumber(item, "variantCount", 0);
  const pending = id !== "" && id === pendingDeletePackageId;
  const accessibleName = escapeAttribute(name);
  const deleteControls = pending
    ? `<span role="status">Delete ${escapeHtml(name)}?</span><button type="button" aria-label="Confirm delete ${accessibleName}" data-intent="library-delete" data-value="${escapeAttribute(id)}">Confirm delete</button><button type="button" aria-label="Cancel deleting ${accessibleName}" data-intent="library-delete-cancel" data-value="${escapeAttribute(id)}">Cancel</button>`
    : `<button type="button" aria-label="Delete ${accessibleName}" data-intent="library-delete-request" data-value="${escapeAttribute(id)}">Delete</button>`;
  return `<article class="card" part="item"><label class="choice-radio"><input type="radio" name="library-package-choice" value="${escapeAttribute(id)}" data-intent="library-select" data-value="${escapeAttribute(id)}" aria-label="Select ${accessibleName}" ${checked ? "checked" : ""}><span class="choice-copy"><strong>${escapeHtml(name)}</strong><span class="muted">${variantCount} playable variant${variantCount === 1 ? "" : "s"}</span></span></label><div class="row"><button type="button" aria-label="Export ${accessibleName}" data-intent="library-export" data-value="${escapeAttribute(id)}">Export</button>${deleteControls}</div></article>`;
}
/** @param {number} used @param {number} quota @returns {string} */
function formatStorage(used, quota) { if (quota <= 0) return `${formatBytes(used)} stored · quota unavailable`; if (used > quota) return `${formatBytes(used)} of ${formatBytes(quota)} used · over quota`; return `${formatBytes(used)} of ${formatBytes(quota)} used (${Math.round((used / quota) * 100)}%)`; }
/** @param {number} bytes @returns {string} */
function formatBytes(bytes) { if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`; }
/** @param {string} state @returns {string} */
function calibrationMessage(state) { const messages = /** @type {Readonly<Record<string, string>>} */ ({ waiting: "Step back until your upper body is visible.", holding: "Hold a steady T-pose for four seconds.", cooldown: "Calibration captured. Relax your arms.", calibrated: "Calibration ready.", tracking_lost: "Tracking lost. A fresh calibration is required.", error: "Calibration could not complete." }); return messages[state] ?? "Calibration required."; }
/** @typedef {Readonly<{schema:"aerobeat/prototype_tuning_identity",version:1,profileId:string,profileVersion:string,contentHash:string,class:string,regenerationRequired:boolean}>} ProfileIdentity */
/** @typedef {Readonly<{class:string,active:ProfileIdentity,profiles:readonly ProfileIdentity[],experimental:boolean,selectedContentHash:string,appliedContentHash:string,pendingContentHash:string|null,regenerationRequired:boolean}>} ProfileClassState */
/** @typedef {Readonly<{id:string,label:string,profileClass:string,profileVersion:string,contentHash:string}>} ProductRadioOption */

/** Native product radio group with no development identity text. @param {string} heading @param {string} name @param {readonly ProductRadioOption[]} options @param {number} selectedIndex @param {string} intent @returns {string} */
function productRadioMarkup(heading, name, options, selectedIndex, intent) {
  return `<section class="panel product-selector" part="panel" aria-labelledby="product-selector-heading"><h2 id="product-selector-heading">${escapeHtml(heading)}</h2><fieldset part="choices"><legend class="visually-hidden">Choose ${escapeHtml(heading)}</legend><div class="product-radios">${options.map((option, index) => `<label class="product-radio"><input type="radio" name="${escapeAttribute(name)}" value="${escapeAttribute(option.id)}" data-intent="${escapeAttribute(intent)}" data-value="${escapeAttribute(option.id)}" data-profile-class="${escapeAttribute(option.profileClass)}" data-profile-version="${escapeAttribute(option.profileVersion)}" data-content-hash="${escapeAttribute(option.contentHash)}" ${index === selectedIndex ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`).join("")}</div></fieldset></section><style>:host([scope]) .product-selector{gap:8px}:host([scope]) fieldset{border:0;margin:0;min-inline-size:0;padding:0}:host([scope]) .product-radios{display:grid;gap:6px}:host([scope]) .product-radio{align-items:center;background:rgba(255,255,255,.72);border:1px solid rgba(53,141,175,.3);border-radius:10px;cursor:pointer;display:flex;font-size:1rem;gap:10px;min-block-size:42px;padding:0 10px}:host([scope]) .product-radio:has(input:checked){background:rgba(10,132,255,.14);border-color:var(--aero-color-focus,#0a84ff);box-shadow:inset 0 0 0 1px var(--aero-color-focus,#0a84ff)}:host([scope]) .product-radio input[type="radio"]{accent-color:var(--aero-color-focus,#0a84ff);block-size:42px;flex:0 0 42px;inline-size:42px;margin:0;padding:0}:host([scope]) .product-radio span{font-weight:750}:host([scope][compact]) .product-selector h2{block-size:1px;clip:rect(0 0 0 0);clip-path:inset(50%);inline-size:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap}</style>`;
}

/** Human-facing live visual label. @param {string} profileId @returns {string} */
function visualProfileLabel(profileId) {
  const productName = profileId.replace(/^aero\.visual\./u, "").replaceAll(/(?:^|[._-])experimental(?:[._-]|$)/giu, " ").trim();
  return titleCase(productName || "Visual");
}

/** Validate one complete selector snapshot without invoking accessors. @param {unknown} value @returns {boolean} */
function isValidProfilePresenterSnapshot(value) {
  if (!hasExactKeys(value, ["selectedProfileId", "sessionState", "profileClasses"])) return false;
  if (typeof value.selectedProfileId !== "string" || !prototypeOptions.some((option) => option.id === value.selectedProfileId) || typeof value.sessionState !== "string" || value.sessionState.length > 64 || !isExactDataArray(value.profileClasses, 3)) return false;
  const seen = new Set();
  for (const state of value.profileClasses) {
    const classDescriptor = typeof state === "object" && state !== null ? Object.getOwnPropertyDescriptor(state, "class") : undefined;
    if (!classDescriptor?.enumerable || !("value" in classDescriptor) || typeof classDescriptor.value !== "string" || !profileClasses.includes(classDescriptor.value) || seen.has(classDescriptor.value)) return false;
    const isConverter = classDescriptor.value === "converter_regeneration";
    const fields = isConverter ? ["class", "active", "profiles", "experimental", "selectedContentHash", "appliedContentHash", "pendingContentHash", "regenerationRequired"] : ["class", "active", "profiles", "experimental"];
    if (!hasExactKeys(state, fields) || !isPrototypeTuningIdentity(state.active) || state.active.class !== state.class || typeof state.experimental !== "boolean" || !isExactDataArray(state.profiles, 64) || !state.profiles.every((identity) => isPrototypeTuningIdentity(identity) && identity.class === state.class)) return false;
    if (isConverter) {
      const selected = state.selectedContentHash;
      const applied = state.appliedContentHash;
      const pending = state.pendingContentHash;
      if (!isBareHash(selected) || !isBareHash(applied) || (pending !== null && !isBareHash(pending)) || typeof state.regenerationRequired !== "boolean" || state.active.contentHash !== selected || state.active.regenerationRequired !== state.regenerationRequired) return false;
      if (state.regenerationRequired ? pending !== selected || selected === applied : pending !== null || selected !== applied) return false;
    }
    seen.add(state.class);
  }
  return seen.size === 3;
}
/** @param {unknown} value @param {number} maximumLength @returns {value is readonly unknown[]} */
function isExactDataArray(value, maximumLength) {
  if (!Array.isArray(value) || value.length > maximumLength) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || keys.at(-1) !== "length") return false;
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !("value" in descriptor)) return false;
  }
  return true;
}
/** @param {unknown} value @returns {value is string} */
function isBareHash(value) { return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value); }
/** @param {Readonly<Record<string, unknown>>} snapshot @returns {readonly ProfileClassState[]} */
function normalizeProfileClassStates(snapshot) {
  const result = [];
  for (const source of readRecordList(snapshot, "profileClasses")) {
    const active = /** @type {ProfileIdentity} */ (readRecord(source, "active"));
    const profiles = /** @type {ProfileIdentity[]} */ (readRecordList(source, "profiles"));
    profiles.sort((left, right) => `${left.profileId}\u0000${left.profileVersion}\u0000${left.contentHash}`.localeCompare(`${right.profileId}\u0000${right.profileVersion}\u0000${right.contentHash}`));
    const isConverter = active.class === "converter_regeneration";
    result.push(Object.freeze({ class: active.class, active, profiles: Object.freeze(profiles), experimental: readBoolean(source, "experimental", false), selectedContentHash: isConverter ? readString(source, "selectedContentHash", "") : active.contentHash, appliedContentHash: isConverter ? readString(source, "appliedContentHash", "") : active.contentHash, pendingContentHash: isConverter ? (source.pendingContentHash === null ? null : readString(source, "pendingContentHash", "")) : null, regenerationRequired: isConverter && readBoolean(source, "regenerationRequired", false) }));
  }
  result.sort((left, right) => profileClasses.indexOf(left.class) - profileClasses.indexOf(right.class));
  return Object.freeze(result);
}
/** @param {ProfileClassState} state @param {boolean} scoringDisabled @param {string} scoringReason @returns {string} */
function profileClassMarkup(state, scoringDisabled, scoringReason) {
  const isScoring = state.class === "between_run_ruleset";
  const isConverter = state.class === "converter_regeneration";
  const disabled = isScoring && scoringDisabled;
  const policy = state.class === "live_visual" ? "Applies immediately." : isScoring ? scoringReason : state.regenerationRequired ? "Regenerate content to apply this converter profile." : "Selected converter profile matches generated content.";
  const options = state.profiles.length ? `<div class="row" aria-label="${escapeAttribute(titleCase(state.class))} profile choices">${state.profiles.map((profile) => { const active = profile.profileId === state.active.profileId && profile.profileVersion === state.active.profileVersion && profile.contentHash === state.active.contentHash; return `<button type="button" data-intent="prototype-profile-select" data-profile-class="${escapeAttribute(profile.class)}" data-value="${escapeAttribute(profile.profileId)}" data-profile-version="${escapeAttribute(profile.profileVersion)}" data-content-hash="${escapeAttribute(profile.contentHash)}" aria-pressed="${active}" ${disabled ? "disabled" : ""} aria-label="Select ${escapeAttribute(profile.profileId)} ${escapeAttribute(titleCase(profile.class))} profile">${escapeHtml(profile.profileId)}</button>`; }).join("")}</div>` : "";
  const converterTruth = isConverter ? `<p class="muted compact-converter-truth" role="status" aria-live="polite">Selected ${escapeHtml(state.selectedContentHash)}<br>Applied ${escapeHtml(state.appliedContentHash)}<br>Pending ${escapeHtml(state.pendingContentHash ?? "none")}</p>` : "";
  const policyClass = disabled ? "compact-critical" : "compact-explanatory";
  return `<article class="card" data-profile-class="${escapeAttribute(state.class)}"><div class="row"><h3>${escapeHtml(titleCase(state.class))}</h3>${state.experimental ? `<span class="pill compact-telemetry">Experimental</span>` : ""}${state.regenerationRequired ? `<span class="pill error">Regeneration required</span>` : `<span class="pill">Applied</span>`}</div>${identityMarkup(state.active)}<p class="muted live ${policyClass}" role="status" aria-live="polite">${escapeHtml(policy)}</p>${converterTruth}${options}</article>`;
}
/** @param {ProfileIdentity} identity @returns {string} */
function identityMarkup(identity) { return `<div class="compact-identity" part="profile-identity"><strong>${escapeHtml(identity.profileId)}</strong><p class="muted">Version ${escapeHtml(identity.profileVersion)} · ${escapeHtml(identity.class)}<br>Hash ${escapeHtml(identity.contentHash)}</p></div>`; }
/** @param {string} url @returns {boolean} */
function isSafeVisualUrl(url) { if (url === "") return false; try { const parsed = new URL(url, document.baseURI); return parsed.protocol === "https:" || parsed.protocol === "blob:" || (parsed.protocol === "http:" && parsed.hostname === "127.0.0.1"); } catch { return false; } }
