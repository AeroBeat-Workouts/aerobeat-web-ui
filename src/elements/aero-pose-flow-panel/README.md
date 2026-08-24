# aero-pose-flow-panel

`aero-pose-flow-panel` displays the current normalized pose frame and gameplay-facing draft input events for deterministic runtime proving scenes.

The component accepts declarative `source-id`, `timestamp-ms`, and `input-summary` attributes for static scenes. Runtime callers can use `setPoseFrame()`, `setInputEvents()`, or `setProvingState()` with normalized public data.
