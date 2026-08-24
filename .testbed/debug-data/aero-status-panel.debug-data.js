// @ts-check

/**
 * Representative status panel states for scene validation.
 *
 * @type {Readonly<{
 *   cameraWaiting: { heading: string, status: string },
 *   replayReady: { heading: string, status: string }
 * }>}
 */
export const aeroStatusPanelDebugStates = Object.freeze({
  cameraWaiting: {
    heading: "Camera calibration",
    status: "Waiting for secure live camera access"
  },
  replayReady: {
    heading: "Replay feed",
    status: "Fixture pose frames ready"
  }
});
