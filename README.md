# aerobeat-web-ui

AeroBeat native Web Components for calibration, content discovery/authoring status, gameplay HUDs, pause/countdown, profiles, fullscreen and testbed screens.

## Responsibility

This repository owns product presenters built from named `aero-*` Web Components. Components accept immutable public snapshots, render accessible state, and emit documented composed/bubbling intent events. They do not own style-token definitions, BeatSaver transport, ZIP parsing, Worker conversion, IndexedDB, camera/CV, calibration math, gameplay scoring, renderer traversal, or assembly service lookup.

The embeddable product root is `aero-game`, owned by `aerobeat-web-assembly`. This package does not define or retain an `aerobeat-app` root.

## Product Presenter API

`src/elements/aero-product-presenters.js` exports the Task 9 presenter set and the single `aero:ui:intent` event contract:

- `aero-beatsaver-browser`: bounded search/latest/results/detail/version, remote Preview/Stop and local-ZIP-picker intents. Populated map results are one native radio group checked from a valid `selectedMap.mapId`, otherwise the first result. Compact detail is version-level Preview, Version and Download only: singleton Version is a labeled static value and two or more versions use one native select. Difficulty remains available only in default development mode.
- `aero-content-import-progress`: acquisition/conversion/persistence progress and cancellation intent.
- `aero-content-library`: authored packages, bounded quota truth, select/export, compact local Preview/Stop, and explicit two-step delete-confirmation intents. Default mode retains per-package development management. Compact Music consumes bounded downloaded-song collection summaries, renders one checked song/version radio, and exposes Preview, downloaded Difficulty, Export and collection Delete exactly once for the selected song. Downloaded Difficulty is a native select for two or more package choices and a labeled static output for one. Legacy package summaries become independent singleton song choices.
- `aero-calibration-badge` and `aero-calibration-screen`: automatic T-pose waiting/holding/cooldown/ready/loss composition and explicit reset intent.
- `aero-grid-playfield`: visible shared 4×3 renderer host; `getRenderSurface()` is the public attachment seam.
- `aero-flow-hud`, `aero-boxing-track-hud`, `aero-boxing-spatial-hud`: mode-specific presentation only.
- `aero-tracking-pause` and `aero-resume-countdown`: tracking-loss/recalibration and frozen-time countdown overlays.
- `aero-background-environment`: cosmetic environment state; loading/fallback policy remains external.
- `aero-session-actions`: compact native Start/Test action row. It consumes bounded `downloadedPlayable`, `activeAction`, and `pendingAction` presentation truth; gates both actions with one minimal Music prerequisite; and emits empty-payload `session-start`/`session-test` intents. It never receives packages, media, camera, score, or session services.
- `aero-fullscreen-button`: child-owned user-gesture `fullscreen-request`/`fullscreen-exit` intent and public state.
- `aero-capabilities-panel` and `aero-error-panel`: capability/limitation and user-safe diagnostics.
- `aero-prototype-selector`: the default, omitted-`scope` mode remains the full development presenter with Flow plus all four Boxing combinations and bounded `profileClasses` states for `live_visual`, `between_run_ruleset`, and `converter_regeneration`. Each state consumes the exact public seven-field tuning identity (`schema`, `version`, ID/version, bare SHA-256, class, regeneration truth) and may separately label the host choice as experimental; visual choices apply immediately, scoring choices are disabled with a live reason during play/countdown and enabled between runs, and converter telemetry distinguishes selected/applied/pending hashes plus regeneration truth. Product embeds may instead set `scope="gameplay"` for the five human gameplay choices or `scope="visuals"` for human-labeled `live_visual` choices. Scoped choices are native radios with one deterministic valid snapshot selection or first-option fallback; scoped views omit development metadata and management controls. Import/export/reset and profile-selection intents retain scalar identity fields only; the host resolves and owns profile bundles.

Intent details are `{ type, payload }`. Payloads contain scalar IDs/query values only. Compact BeatSaver Download carries exact `mapId`/`versionHash`; default development import retains `difficultyId`. Compact downloaded-song selection carries `collectionId`, downloaded Difficulty carries exact `collectionId`/`packageId`, Preview/Export carry `packageId`, and Delete carries `collectionId`. Raw `File`, ZIP/audio bytes, media objects, screenshots, provider DTOs and service objects never leave UI. External snapshots are narrowed into immutable JSON-like records without executing accessors.

Every product presenter supports the provider-neutral boolean `compact` property/`[compact]` attribute for gameplay drawer composition. Compact product mode limits visible copy to human option labels and true action labels, plus concise errors, import progress/cancel, and blocking limitations. Compact remote Music has no pre-download Difficulty. Compact local Music shows concise downloaded-song radios and one selected-song Preview/Difficulty/Export/Delete area; repeated difficulty packages stay inside their song collection and no Play action is rendered. Author/map/package IDs, mapped-by details, redundant selected-item details, storage/quota, variant counts, schema/version/hash/development metadata, explanatory copy and nonerror status copy remain visually suppressed while accessible control names and live announcements are preserved. Controls remain native, keyboard-operable and at least 42px high. Removing `[compact]` restores the exact default presentation without changing presenter state or emitting intents. Drawer open/close and hamburger ownership remain with assembly. The current `aero-game` shell also owns the raw top action markup; its Task 4 integration must replace that markup with `aero-session-actions`, project exact selected-downloaded-package readiness plus active/pending mode truth, and map `session-start`/`session-test` to generation-bound orchestration. Camera, calibration, Preview stop, audio, scoring, and menu pause/restart behavior remain assembly responsibilities.

Existing reusable primitives remain exported: `aero-button`, `aero-select`, `aero-status-panel`, `aero-media-pose-preview`, and `aero-pose-flow-panel`.

## Lifecycle, accessibility and embedding

- Product presenters attach DOM/listeners only while connected and remove delegated listeners on disconnect; reconnect installs one listener set. Calibration composition preserves the same media preview and renderer surface across snapshot updates.
- Components fill their assigned parent and never assume `100vh`, body ownership, routes, or browser history.
- Controls use native keyboard semantics, visible focus, touch-sized targets, labels and live regions. Prototype radios use roving arrow-key selection; tracking pause moves focus into its alert dialog and restores it afterward. Desktop, 390px portrait and phone-landscape layouts are exercised in Chromium.
- Platform reduced-motion preferences suppress component transitions; gameplay animation policy remains with renderer/theme owners.
- Stable selected `::part` surfaces support controlled direct-embed theming. Arbitrary slots are not an integration contract.
- Assembly consumes public setters and events; it must not traverse component shadow roots.

## Adjacent Repositories

- `aerobeat-web-contracts` owns public element names, ruleset/recipe IDs, snapshots and host/iframe contracts.
- `aerobeat-web-style` owns generic theme tokens consumed through CSS custom properties.
- `aerobeat-web-renderer` owns WebGL2 gameplay drawing attached through the grid host surface.
- `aerobeat-web-video` owns camera/video lifecycle consumed by the preview presenter.
- `aerobeat-web-vendor-beatsaver` owns browser provider acquisition and inspection.
- `aerobeat-web-content-authoring` owns conversion, persistence and export.
- `aerobeat-web-assembly` composes presenters and owns `aero-game`, commands, fullscreen execution and service policy.

Runtime code imports only documented public package exports. Do not import sibling `src/`, testbed, internal or vendor-native surfaces.

## Testbed and validation

Component scenes live under `.testbed/scenes/`; representative state modules live under `.testbed/debug-data/`. Generated testbed links and installed modules remain uncommitted.

Run:

```bash
npm run check
npm test
npm run test:browser
npm pack --dry-run --json
```

Validation covers strict JSDoc/no-escape and public imports, named-component scenes, existing media-pose composition, product intent privacy, bounded BeatSaver results, content/calibration/gameplay/profile states, 390px layout, focusable names, live regions, reconnect listener exactness, package allowlisting and zero warning/error console noise.

Implementation decisions remain in `docs/decisions/`. Public contributor/user documentation belongs in `aerobeat-web-docs` after acceptance.
