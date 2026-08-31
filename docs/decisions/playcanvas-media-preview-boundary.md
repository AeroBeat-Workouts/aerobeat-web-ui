# PlayCanvas media-preview boundary

`aero-media-pose-preview` consumes only the public `AeroPlayCanvasRenderer` / `createAeroPlayCanvasRenderer` API from `@aerobeat/web-renderer`. The UI package does not retain a legacy WebGL2 identity, alias, fallback, or renderer implementation.

The presenter owns one stable shadow-DOM canvas and one renderer facade. Connection attaches the facade, delegates exact CSS dimensions and the current device-pixel ratio through `resize(...)`, and renders only when UI state, pose data, or resize observation requests it. Disconnection detaches the facade; reconnection reuses the same presenter canvas and renderer facade while allowing the facade to recreate its PlayCanvas application and context. Injected renderer ownership remains external, so replacement detaches rather than destroys the supplied facade.

The preview remains presentation-only. `@aerobeat/web-video` owns media attachment, camera lifecycle, and video timing; CV and assembly own pose production and cadence. The UI does not request media, run inference, schedule a gameplay/render animation loop, or transfer pose/scoring/time authority to PlayCanvas. Public preview snapshots remain bounded serializable scalar/record data.

Browser validation uses the real renderer at DPR2 and proves displayed alpha pixels, normalized landmark mapping, transparent composition, stable-canvas reconnect, truthful detach/reattach state, and the renderer's manual-render/no-second-RAF capability. A separate injected spy preserves exact presenter-call and smoothing assertions without depending on private renderer traversal.
