# Product presenter boundary

## Status

Accepted for the embeddable gameplay prototype.

## Decision

`@aerobeat/web-ui` owns named `aero-*` Web Components that present immutable public snapshots and emit one composed, bubbling `aero:ui:intent` event. Intent details contain a stable `type` and JSON-safe scalar metadata only. File objects, ZIP/audio bytes, media objects, provider DTOs, service instances, screenshots, and renderer objects are never event payloads.

The presenter package does not call BeatSaver, inspect ZIPs, run conversion Workers, open IndexedDB, request camera access, compute calibration, judge gameplay, traverse another package's shadow root, or discover assembly services. Assembly supplies snapshots and translates intents into public commands.

## Lifecycle

Task 9 presenters defer shadow DOM and listener setup until `connectedCallback()`. Delegated click/change/submit listeners are removed in `disconnectedCallback()` and restored once on reconnect. Constructors retain local scalar state only. Renderer integration uses `aero-grid-playfield.getRenderSurface()` rather than external shadow-root traversal.

## Layout and embedding

Components fill their assigned parent surfaces and never own `body`, history, routes, or `100vh`. They support narrow phone and landscape composition, keyboard focus, touch-sized controls, live status regions, and reduced-motion platform preferences. Selected stable `::part` surfaces allow controlled direct-embed theming; arbitrary slots are not part of the contract.

## Profiles and tuning

`aero-prototype-selector` exposes Flow plus the four experimental Semantic Track/Spatial Grid × Row Family/Cut Family combinations. It displays visual, ruleset, and converter identity/version/hash telemetry and marks converter changes that require regeneration. It emits select/import-request/export/reset intent only and does not mutate profiles or regenerate content.

## Fullscreen

`aero-fullscreen-button` presents the public fullscreen snapshot and emits `fullscreen-request` from a user gesture. The child `aero-game` assembly remains responsible for calling the Fullscreen API and reporting capability/error state.
