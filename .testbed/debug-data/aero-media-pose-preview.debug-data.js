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
      Object.freeze({ name: "left_wrist", x: 0.22, y: 0.62, confidence: 0.92 }),
      Object.freeze({ name: "left_elbow", x: 0.28, y: 0.54, confidence: 0.9 }),
      Object.freeze({ name: "left_shoulder", x: 0.34, y: 0.46, confidence: 0.88 }),
      Object.freeze({ name: "right_shoulder", x: 0.68, y: 0.46, confidence: 0.9 }),
      Object.freeze({ name: "right_elbow", x: 0.76, y: 0.55, confidence: 0.89 }),
      Object.freeze({ name: "right_wrist", x: 0.82, y: 0.64, confidence: 0.91 }),
      Object.freeze({ name: "left_hip", x: 0.38, y: 0.82, confidence: 0.82 })
    ])
  }),
  secondPoseFrame: Object.freeze({
    sourceId: "aero.cv.live-movenet",
    timestampMs: 1300,
    mirrored: true,
    landmarks: Object.freeze([
      Object.freeze({ name: "nose", x: 0.26, y: 0.22, confidence: 0.96 }),
      Object.freeze({ name: "left_wrist", x: 0.42, y: 0.66, confidence: 0.93 }),
      Object.freeze({ name: "left_elbow", x: 0.48, y: 0.58, confidence: 0.91 }),
      Object.freeze({ name: "left_shoulder", x: 0.38, y: 0.48, confidence: 0.9 }),
      Object.freeze({ name: "right_shoulder", x: 0.72, y: 0.49, confidence: 0.91 }),
      Object.freeze({ name: "right_elbow", x: 0.78, y: 0.57, confidence: 0.9 }),
      Object.freeze({ name: "right_wrist", x: 0.84, y: 0.66, confidence: 0.92 }),
      Object.freeze({ name: "right_hip", x: 0.66, y: 0.82, confidence: 0.82 })
    ])
  })
});
