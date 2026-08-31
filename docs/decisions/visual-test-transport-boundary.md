# Visual Test transport boundary

## Status

Accepted for the Flow perspective and inspection prototype.

## Decision

`aero-visual-test-transport` is the named compact UI-owned transport presenter. Its public snapshot has exactly four own enumerable data fields:

```text
{ active: boolean, playing: boolean, currentMs: number, durationMs: number }
```

The presenter copies and freezes accepted state, rejects accessors/prototypes/symbols/extra fields, bounds duration to 24 hours, and clamps current time to duration. It is hidden whenever `active` is false. It never receives a package, audio/media object, authored event, byte buffer, service, generation token, score, or judgement.

The single composed/bubbling `aero:ui:intent` event carries one of these exact immutable details:

```text
{ type: "visual-test-play", payload: {} }
{ type: "visual-test-pause", payload: {} }
{ type: "visual-test-seek", payload: { milliseconds: number } }
```

A playing transport requests Pause once when native range scrubbing begins, then emits seek milliseconds on native `input` events so pointer and keyboard interaction share one path. The presenter updates its visible and accessible timecode immediately during input. It emits no release/resume intent; the approved default is to remain paused for inspection. Assembly owns audio pause/seek, generation binding, animation-frame coalescing, gameplay paused-clock synchronization and renderer updates. Scored Play does not receive this presenter state.

## Layout and lifecycle

The transport is bottom-aligned, uses native button/range semantics, maintains controls at least 42px high, exposes visible focus, and reserves bottom/inline safe areas through `env(safe-area-inset-*)` plus testable host fallbacks. The range fills the center track and the current total-minute `mm:ss` timecode stays on the right. Reduced-motion preference suppresses transitions and animation.

The shadow controls are stable across snapshot updates so timeline focus and native pointer interaction survive frequent clock commits. Click, input and pointer listeners are installed only while connected and are removed exactly on disconnect; reconnect restores one listener set.
