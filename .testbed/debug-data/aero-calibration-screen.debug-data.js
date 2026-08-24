// @ts-check

/**
 * Representative calibration screen states for scene validation.
 *
 * @type {Readonly<{
 *   waitingForCamera: {
 *     statusPanel: { heading: string, status: string },
 *     primaryAction: { label: string }
 *   },
 *   replayReady: {
 *     statusPanel: { heading: string, status: string },
 *     primaryAction: { label: string }
 *   }
 * }>}
 */
export const aeroCalibrationScreenDebugStates = Object.freeze({
  waitingForCamera: {
    statusPanel: {
      heading: "Camera calibration",
      status: "Waiting for live, video, or replay pose feed"
    },
    primaryAction: {
      label: "Begin calibration"
    }
  },
  replayReady: {
    statusPanel: {
      heading: "Replay calibration",
      status: "Fixture pose frames ready for calibration preview"
    },
    primaryAction: {
      label: "Start replay calibration"
    }
  }
});
