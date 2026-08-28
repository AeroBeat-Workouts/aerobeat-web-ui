// @ts-check

import { conversionRecipeIds, elementNames, rulesetIds } from "@aerobeat/web-contracts";

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
  .muted { color: var(--aero-color-muted, #486c7d); font-size: .82rem; }
  .row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
  .stack { display: grid; gap: 8px; }
  .control, button, input, select { border: 1px solid var(--aero-color-border, rgba(53,141,175,.5)); border-radius: 8px; color: inherit; font: inherit; min-block-size: 42px; }
  button { background: linear-gradient(180deg, #fff, #bcecff); cursor: pointer; font-weight: 750; padding: 8px 13px; touch-action: manipulation; }
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
  progress { accent-color: var(--aero-color-focus, #0a84ff); inline-size: 100%; }
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
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.shadowRoot?.addEventListener("click", this.boundClick);
    this.shadowRoot?.addEventListener("change", this.boundChange);
    this.shadowRoot?.addEventListener("submit", this.boundSubmit);
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.boundClick);
    this.shadowRoot?.removeEventListener("change", this.boundChange);
    this.shadowRoot?.removeEventListener("submit", this.boundSubmit);
  }

  /** @param {AeroPresenterSnapshot} snapshot */
  setSnapshot(snapshot) {
    this.presenterSnapshot = Object.freeze({ ...snapshot });
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
    this.emitIntent("beatsaver-search", { query: input instanceof HTMLInputElement ? input.value.trim() : "" });
  }

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
    this.shadowRoot.innerHTML = `<style>${sharedStyles}</style>${markup}`;
  }
}

/** BeatSaver discovery, detail, version, difficulty and local-import intent presenter. */
export class AeroBeatSaverBrowser extends AeroPresenterElement {
  render() {
    const state = readString(this.presenterSnapshot, "state", "idle");
    const query = readString(this.presenterSnapshot, "query", "");
    const results = readRecordList(this.presenterSnapshot, "results").slice(0, 50);
    const selected = readRecord(this.presenterSnapshot, "selectedMap");
    const versions = readRecordList(this.presenterSnapshot, "versions");
    const difficulties = readStringList(this.presenterSnapshot, "difficulties");
    const selectedVersion = readString(this.presenterSnapshot, "selectedVersionHash", "");
    const selectedDifficulty = readString(this.presenterSnapshot, "selectedDifficulty", "");
    const error = readString(this.presenterSnapshot, "errorMessage", "");
    const busy = state === "loading";
    this.renderMarkup(`
      <section class="panel" part="panel" aria-labelledby="beatsaver-heading">
        <h2 id="beatsaver-heading">Find BeatSaver maps</h2>
        <form class="row" part="search" data-form="search">
          <label style="flex:1 1 14rem">Search maps<input part="search-input" data-field="query" value="${escapeAttribute(query)}" autocomplete="off" ${busy ? "disabled" : ""}></label>
          <button part="search-button" type="submit" ${busy ? "disabled" : ""}>Search</button>
          <button part="latest-button" type="button" data-intent="beatsaver-latest" ${busy ? "disabled" : ""}>Latest</button>
          <button part="local-import-button" type="button" data-intent="local-zip-request">Choose local ZIP</button>
        </form>
        <p class="live ${error ? "error" : "muted"}" role="status" aria-live="polite">${escapeHtml(error || statusText(state, results.length))}</p>
        <div class="cards" part="results" role="list" aria-label="BeatSaver results">
          ${results.map((result) => mapResultMarkup(result)).join("") || `<p class="muted">${state === "empty" ? "No compatible maps found." : "Search or browse latest maps."}</p>`}
        </div>
        ${selected ? `<section class="card" part="detail" aria-label="Selected map"><h3>${escapeHtml(readString(selected, "name", "Selected map"))}</h3><p class="muted">${escapeHtml(readString(selected, "songAuthorName", ""))} · mapped by ${escapeHtml(readString(selected, "levelAuthorName", "Unknown"))}</p>
          <label>Version<select part="version-select" data-intent="beatsaver-version-select">${versions.map((version) => optionMarkup(readString(version, "versionHash", ""), readString(version, "label", readString(version, "versionHash", "Version")), selectedVersion)).join("")}</select></label>
          <label>Difficulty<select part="difficulty-select" data-intent="beatsaver-difficulty-select">${difficulties.map((difficulty) => optionMarkup(difficulty, difficulty, selectedDifficulty)).join("")}</select></label>
          <button part="import-button" type="button" data-intent="beatsaver-import" ${selectedVersion && selectedDifficulty ? "" : "disabled"}>Import selected map</button></section>` : ""}
      </section>`);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) {
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
      this.emitIntent(type, { versionHash: target instanceof HTMLSelectElement ? target.value : "" });
      return;
    }
    if (type === "beatsaver-difficulty-select") {
      this.emitIntent(type, { difficultyId: target instanceof HTMLSelectElement ? target.value : "" });
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
  render() {
    const packages = readRecordList(this.presenterSnapshot, "packages").slice(0, 100);
    const used = readNumber(this.presenterSnapshot, "usedBytes", 0);
    const quota = readNumber(this.presenterSnapshot, "quotaBytes", 0);
    const error = readString(this.presenterSnapshot, "errorMessage", "");
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="library-heading"><h2 id="library-heading">My AeroBeat library</h2><p class="muted" part="storage">${escapeHtml(formatStorage(used, quota))}</p>${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}<div class="cards" part="items" role="list">${packages.map((item) => libraryItemMarkup(item)).join("") || `<p class="muted">No locally authored packages yet.</p>`}</div></section>`);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) { this.emitIntent(type, { packageId: target.dataset.value ?? "" }); }
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
    this.renderMarkup(`<section class="playfield ${dimmed ? "dimmed" : ""}" part="playfield" aria-label="${escapeAttribute(label)}"><div class="surface" part="render-surface" data-render-surface></div><div class="receptors" aria-hidden="true">${Array.from({ length: 12 }, (_, index) => `<i data-cell="${index}"></i>`).join("")}</div></section><style>:host{block-size:100%;inline-size:100%;min-block-size:12rem}.playfield{background:linear-gradient(180deg,var(--aero-playfield-background-start,#071426),var(--aero-playfield-background-end,#153b5d));block-size:100%;border-radius:12px;inline-size:100%;overflow:hidden;position:relative}.playfield.dimmed{filter:brightness(.45)}.surface{inset:0;position:absolute}.receptors{display:grid;gap:2%;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);inset:8%;position:absolute}.receptors i{border:1px solid color-mix(in srgb,var(--aero-role-receptor,#d9f5ff) 32%,transparent);border-radius:8px}</style>`);
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
    this.renderMarkup(`<section class="tracks" part="hud" aria-label="Semantic Track Boxing"><div class="lane left" part="left-lane"><strong>Athlete left</strong><span>${escapeHtml(left)}</span></div><div class="lane right" part="right-lane"><strong>Athlete right</strong><span>${escapeHtml(right)}</span></div><div class="defense" part="defense-layer">Defense: ${escapeHtml(defense)}</div></section><style>.tracks{display:grid;gap:8px;grid-template-columns:1fr 1fr}.lane,.defense{border-radius:10px;color:#fff;display:grid;gap:4px;min-block-size:64px;padding:12px}.left{background:var(--aero-role-left,#2693ff)}.right{background:var(--aero-role-right,#39c96b)}.defense{background:var(--aero-role-guard,#9a67ea);grid-column:1/-1;min-block-size:auto}</style>`);
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
  render() {
    const active = readBoolean(this.presenterSnapshot, "active", false);
    const message = readString(this.presenterSnapshot, "message", "Tracking paused. Recalibrate to continue.");
    const reason = readString(this.presenterSnapshot, "reason", "tracking_lost");
    this.toggleAttribute("hidden", !active);
    this.renderMarkup(`<section class="overlay" part="overlay" role="alertdialog" aria-modal="true" aria-labelledby="tracking-heading"><h2 id="tracking-heading">Workout paused</h2><p>${escapeHtml(message)}</p><span class="pill">${escapeHtml(reason)}</span><button part="recalibrate-button" type="button" data-intent="calibration-reset">Recalibrate</button></section><style>:host{inset:0;position:absolute;z-index:20}:host([hidden]){display:none}.overlay{align-content:center;background:rgba(4,17,30,var(--aero-overlay-dim-opacity,.72));block-size:100%;color:#fff;display:grid;gap:14px;inline-size:100%;justify-items:center;padding:24px;text-align:center}</style>`);
  }
}

/** Frozen-time resume countdown presenter. */
export class AeroResumeCountdown extends AeroPresenterElement {
  render() {
    const active = readBoolean(this.presenterSnapshot, "active", false);
    const value = readNumber(this.presenterSnapshot, "value", 3);
    const frozen = readBoolean(this.presenterSnapshot, "frozen", true);
    this.toggleAttribute("hidden", !active);
    this.renderMarkup(`<div class="countdown" part="countdown" role="status" aria-live="assertive" aria-label="Resume countdown ${value}"><strong>${value}</strong><span>${frozen ? "Workout time frozen" : "Get ready"}</span></div><style>:host([hidden]){display:none}.countdown{align-items:center;background:rgba(4,17,30,.68);border-radius:50%;color:#fff;display:grid;inline-size:8rem;justify-items:center;min-block-size:8rem;padding:12px;text-align:center}.countdown strong{font-size:3.6rem;line-height:1}</style>`);
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
    this.renderMarkup(`<div class="stack"><button part="control" type="button" data-intent="fullscreen-request" aria-pressed="${active}" ${supported && !pending ? "" : "disabled"}>${active ? "Exit fullscreen" : "Enter fullscreen"}</button>${error ? `<span class="error" role="status">${escapeHtml(error)}</span>` : ""}</div>`);
  }
}

/** Capability and limitation presenter. */
export class AeroCapabilitiesPanel extends AeroPresenterElement {
  render() {
    const limitations = readStringList(this.presenterSnapshot, "limitations");
    const capabilities = ["camera", "fullscreen", "autoplay", "webgl2", "indexedDb", "worker", "directBeatSaverCors", "localZipImport"];
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="capabilities-heading"><h2 id="capabilities-heading">Device capabilities</h2><div class="cards">${capabilities.map((name) => `<span class="pill">${escapeHtml(titleCase(name))}: ${readBoolean(this.presenterSnapshot, name, false) ? "available" : "unavailable"}</span>`).join("")}</div>${limitations.length ? `<ul part="limitations">${limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="muted">No reported limitations.</p>`}</section>`);
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
  Object.freeze({ id: "flow", label: "Flow · Grid", rulesetId: rulesetIds[0], recipeId: "" }),
  Object.freeze({ id: "semantic-row", label: "Semantic Track · Row Family", rulesetId: rulesetIds[1], recipeId: conversionRecipeIds[0] }),
  Object.freeze({ id: "spatial-row", label: "Spatial Grid · Row Family", rulesetId: rulesetIds[2], recipeId: conversionRecipeIds[0] }),
  Object.freeze({ id: "semantic-cut", label: "Semantic Track · Cut Family", rulesetId: rulesetIds[1], recipeId: conversionRecipeIds[1] }),
  Object.freeze({ id: "spatial-cut", label: "Spatial Grid · Cut Family", rulesetId: rulesetIds[2], recipeId: conversionRecipeIds[1] })
]);

/** Flow/four-Boxing profile and tuning identity presenter. */
export class AeroPrototypeSelector extends AeroPresenterElement {
  render() {
    const selected = readString(this.presenterSnapshot, "selectedProfileId", "flow");
    const identities = readRecordList(this.presenterSnapshot, "tuningIdentities");
    this.renderMarkup(`<section class="panel" part="panel" aria-labelledby="profiles-heading"><h2 id="profiles-heading">Workout prototype</h2><div class="cards" part="profiles" role="radiogroup" aria-label="Prototype profile">${prototypeOptions.map((option) => `<button type="button" part="profile" role="radio" aria-checked="${selected === option.id}" data-intent="prototype-select" data-value="${option.id}"><strong>${escapeHtml(option.label)}</strong><span class="muted">${escapeHtml(option.rulesetId)}${option.recipeId ? ` · ${escapeHtml(option.recipeId)}` : ""}</span></button>`).join("")}</div><section class="stack" part="telemetry" aria-label="Active tuning identities">${identities.map(identityMarkup).join("") || `<p class="muted">No tuning identity loaded.</p>`}</section><div class="row"><button type="button" part="import-button" data-intent="tuning-import-request">Import profiles</button><button type="button" part="export-button" data-intent="tuning-export">Export profiles</button><button type="button" part="reset-button" data-intent="tuning-reset">Reset profiles</button></div></section>`);
  }

  /** @param {string} type @param {HTMLElement} target */
  onIntent(type, target) {
    if (type === "prototype-select") this.emitIntent(type, { profileId: target.dataset.value ?? "" });
    else this.emitIntent(type);
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
function isPlainRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null); }
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
/** @param {Readonly<Record<string, unknown>>} result @returns {string} */
function mapResultMarkup(result) { const id = readString(result, "mapId", ""); const name = readString(result, "name", "Untitled map"); const author = readString(result, "songAuthorName", "Unknown artist"); return `<article role="listitem"><button class="card" part="result" type="button" data-intent="beatsaver-select-map" data-value="${escapeAttribute(id)}"><strong>${escapeHtml(name)}</strong><span class="muted">${escapeHtml(author)} · ${escapeHtml(id)}</span></button></article>`; }
/** @param {string} value @param {string} label @param {string} selected @returns {string} */
function optionMarkup(value, label, selected) { return `<option value="${escapeAttribute(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`; }
/** @param {Readonly<Record<string, unknown>>} item @returns {string} */
function libraryItemMarkup(item) { const id = readString(item, "packageId", ""); const name = readString(item, "name", "Untitled package"); const variantCount = readNumber(item, "variantCount", 0); return `<article class="card" part="item" role="listitem"><h3>${escapeHtml(name)}</h3><p class="muted">${variantCount} playable variant${variantCount === 1 ? "" : "s"}</p><div class="row"><button type="button" data-intent="library-select" data-value="${escapeAttribute(id)}">Play</button><button type="button" data-intent="library-export" data-value="${escapeAttribute(id)}">Export</button><button type="button" data-intent="library-delete" data-value="${escapeAttribute(id)}">Delete</button></div></article>`; }
/** @param {number} used @param {number} quota @returns {string} */
function formatStorage(used, quota) { if (quota <= 0) return `${formatBytes(used)} stored · quota unavailable`; return `${formatBytes(used)} of ${formatBytes(quota)} used (${Math.round((used / quota) * 100)}%)`; }
/** @param {number} bytes @returns {string} */
function formatBytes(bytes) { if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`; }
/** @param {string} state @returns {string} */
function calibrationMessage(state) { const messages = /** @type {Readonly<Record<string, string>>} */ ({ waiting: "Step back until your upper body is visible.", holding: "Hold a steady T-pose for four seconds.", cooldown: "Calibration captured. Relax your arms.", calibrated: "Calibration ready.", tracking_lost: "Tracking lost. A fresh calibration is required.", error: "Calibration could not complete." }); return messages[state] ?? "Calibration required."; }
/** @param {Readonly<Record<string, unknown>>} identity @returns {string} */
function identityMarkup(identity) { const profileId = readString(identity, "profileId", "unknown"); const profileVersion = readString(identity, "profileVersion", "unknown"); const contentHash = readString(identity, "contentHash", "unavailable"); const identityClass = readString(identity, "class", "live_visual"); const regeneration = readBoolean(identity, "regenerationRequired", false); return `<article class="card"><div class="row"><strong>${escapeHtml(profileId)}</strong><span class="pill">${escapeHtml(identityClass)}</span>${regeneration ? `<span class="pill error">Regeneration required</span>` : ""}</div><p class="muted">Version ${escapeHtml(profileVersion)} · hash ${escapeHtml(contentHash)}</p></article>`; }
/** @param {string} url @returns {boolean} */
function isSafeVisualUrl(url) { if (url === "") return false; try { const parsed = new URL(url, document.baseURI); return parsed.protocol === "https:" || parsed.protocol === "blob:" || (parsed.protocol === "http:" && parsed.hostname === "127.0.0.1"); } catch { return false; } }
