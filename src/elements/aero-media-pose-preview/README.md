# aero-media-pose-preview

`aero-media-pose-preview` composes a video-owned media surface with the shared WebGL2 landmark overlay renderer.

The element does not request camera permission, run CV inference, or draw landmarks itself. Consumers inject or use the public `@aerobeat/web-video` facade for live camera, loaded video, or replay media attachment, then pass normalized pose frames to `setPoseFrame(...)`. The element sizes its overlay canvas over the same visible media viewport and delegates landmark/skeleton drawing to `@aerobeat/web-renderer`.

The phone calibration checkpoint intentionally renders only `nose`, `left_wrist`, `left_elbow`, `left_shoulder`, `right_shoulder`, `right_elbow`, and `right_wrist`. The presenter maps those names to stable MoveNet IDs before delegating to the renderer, connects the nose to both shoulders, smooths them with the selected tracking profile, and reports the media-time minus pose-frame timestamp delta for latency checks.

## Public Methods

- `setVideoMediaFacade(videoMediaFacade)` injects the `@aerobeat/web-video` facade.
- `setRenderer(renderer)` injects the `@aerobeat/web-renderer` facade.
- `attachCameraStream(stream, source)` attaches a live camera stream through the video facade.
- `attachVideoSource(source)` attaches a loaded video or replay descriptor through the video facade.
- `setSurfaceDescriptor(surface)` updates public fit, mirror, source, and intrinsic media metadata.
- `setPoseFrame(poseFrame)` updates the normalized pose frame drawn by WebGL2.
- `setTrackingProfile("smoother" | "fast")` selects low-jitter or lower-latency preview smoothing.
- `describePreview()` reports source, fit, mirroring, content rect, landmark count, renderer draw count, and comparable media/pose timing delta.
