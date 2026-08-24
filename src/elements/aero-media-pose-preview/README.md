# aero-media-pose-preview

`aero-media-pose-preview` composes a video-owned media surface with the shared WebGL2 landmark overlay renderer.

The element does not request camera permission, run CV inference, or draw landmarks itself. Consumers inject or use the public `@aerobeat/web-video` facade for live camera, loaded video, or replay media attachment, then pass normalized pose frames to `setPoseFrame(...)`. The element sizes its overlay canvas over the same visible media viewport and delegates landmark/skeleton drawing to `@aerobeat/web-renderer`.

## Public Methods

- `setVideoMediaFacade(videoMediaFacade)` injects the `@aerobeat/web-video` facade.
- `setRenderer(renderer)` injects the `@aerobeat/web-renderer` facade.
- `attachCameraStream(stream, source)` attaches a live camera stream through the video facade.
- `attachVideoSource(source)` attaches a loaded video or replay descriptor through the video facade.
- `setSurfaceDescriptor(surface)` updates public fit, mirror, source, and intrinsic media metadata.
- `setPoseFrame(poseFrame)` updates the normalized pose frame drawn by WebGL2.
- `describePreview()` reports source, fit, mirroring, content rect, landmark count, and renderer draw count.
