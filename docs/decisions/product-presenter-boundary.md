# Product presenter boundary

## Status

Accepted for the embeddable gameplay prototype.

## Decision

`@aerobeat/web-ui` owns named `aero-*` Web Components that present immutable public snapshots and emit one composed, bubbling `aero:ui:intent` event. Intent details contain a stable `type` and JSON-safe scalar metadata only. File objects, ZIP/audio bytes, media objects, provider DTOs, service instances, screenshots, and renderer objects are never event payloads.

The presenter package does not call BeatSaver, inspect ZIPs, run conversion Workers, open IndexedDB, request camera access, compute calibration, judge gameplay, traverse another package's shadow root, or discover assembly services. Assembly supplies snapshots and translates intents into public commands.

## Lifecycle

Task 9 presenters defer shadow DOM and listener setup until `connectedCallback()`. Delegated click/change/submit/keydown listeners are removed in `disconnectedCallback()` and restored once on reconnect. Constructors retain local scalar state only. External snapshots are copied into immutable JSON-like data without invoking accessors or retaining class/File/Blob/provider objects. Renderer integration uses `aero-grid-playfield.getRenderSurface()` rather than external shadow-root traversal, and calibration snapshot updates preserve the same preview and render-surface nodes.

## Layout and embedding

Components fill their assigned parent surfaces and never own `body`, history, routes, or `100vh`. They support narrow phone and landscape composition without horizontal overflow, roving-arrow radio selection, modal focus entry/restore, touch-sized controls, live status regions, readable default role colors, and reduced-motion platform preferences. Selected stable `::part` surfaces allow controlled direct-embed theming; arbitrary slots are not part of the contract.

## Profiles and tuning

The default `aero-prototype-selector` development presenter retains Flow plus the four exact experimental ruleset/recipe combinations and its visual, ruleset, and converter identity/version/hash telemetry. The scoped product presenter derives independent controls from the exact `selectedProfileId`: Gameplay is `Flow` (`flow_grid_v2`), `Boxing Lanes` (`boxing_semantic_track_v1`), or `Boxing Grid` (`boxing_spatial_grid_v1`); Boxing also exposes Conversion as `Balanced Height` (`row_family_balanced_height_v1`) or `Source Height` (`cut_family_source_height_v1`). All four Boxing combinations remain selectable without a preferred winner. Compact presentation may visually suppress the outer Gameplay heading, but keeps the Boxing `Conversion` legend visible so the second native radio group remains understandable to sighted users.

Scoped Gameplay emits `gameplay-mode-select` with the exact scalar payload `{ rulesetId }`. Scoped Conversion emits `boxing-conversion-select` with the exact scalar payload `{ recipeId }`. Assembly combines each intent with bounded current/retained mode and conversion state, resolves an existing exact variant, and projects that `selectedProfileId` back in the next snapshot. Because Flow has no conversion selection, assembly must retain its last Boxing conversion choice or establish product policy outside this presenter before resolving a Flow-to-Boxing intent; the UI does not choose a conversion winner. No combined variant, package, profile, or service object crosses the UI boundary. Default development select/import-request/export/reset behavior remains unchanged; the presenter does not mutate profiles or regenerate content.

## Fullscreen

`aero-fullscreen-button` presents the public fullscreen snapshot and emits `fullscreen-request` or `fullscreen-exit` from a user gesture according to active state. The child `aero-game` assembly remains responsible for calling the Fullscreen API and reporting capability/error state. Library deletion is similarly gated by an inline confirmation before the scalar `library-delete` intent is emitted.
