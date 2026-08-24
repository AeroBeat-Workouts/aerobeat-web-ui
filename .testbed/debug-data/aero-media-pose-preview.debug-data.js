// @ts-check

/**
 * Representative pose preview debug state for scene and browser validation.
 */
export const aeroMediaPosePreviewDebugData = Object.freeze({
  surface: Object.freeze({
    sourceKind: "live-camera",
    sourceId: "aero.video.live-camera",
    fitMode: "contain",
    mirrored: true,
    intrinsicWidth: 320,
    intrinsicHeight: 180,
    currentTimeSeconds: 1.25
  }),
  firstPoseFrame: Object.freeze({
    sourceId: "aero.cv.live-movenet",
    timestampMs: 1250,
    mirrored: true,
    landmarks: Object.freeze([
      Object.freeze({ name: "nose", x: 0.2, y: 0.2, confidence: 0.95 }),
      Object.freeze({ name: "left_shoulder", x: 0.34, y: 0.46, confidence: 0.88 }),
      Object.freeze({ name: "right_shoulder", x: 0.68, y: 0.46, confidence: 0.9 })
    ])
  }),
  secondPoseFrame: Object.freeze({
    sourceId: "aero.cv.live-movenet",
    timestampMs: 1300,
    mirrored: true,
    landmarks: Object.freeze([
      Object.freeze({ name: "nose", x: 0.26, y: 0.22, confidence: 0.96 }),
      Object.freeze({ name: "left_shoulder", x: 0.38, y: 0.48, confidence: 0.9 }),
      Object.freeze({ name: "right_shoulder", x: 0.72, y: 0.49, confidence: 0.91 })
    ])
  })
});
