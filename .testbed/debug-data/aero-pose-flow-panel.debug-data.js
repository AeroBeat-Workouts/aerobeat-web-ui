// @ts-check

/**
 * Representative deterministic runtime pose-flow panel state.
 *
 * @type {Readonly<{
 *   poseFrame: {
 *     sourceId: string,
 *     timestampMs: number,
 *     mirrored: boolean,
 *     landmarks: readonly {
 *       name: string,
 *       x: number,
 *       y: number,
 *       confidence: number
 *     }[]
 *   },
 *   inputEvents: readonly {
 *     mode: string,
 *     eventName: string,
 *     summary: string
 *   }[]
 * }>}
 */
export const aeroPoseFlowPanelDebugState = Object.freeze({
  poseFrame: {
    sourceId: "aero.movenet.replay.basic-upper-body",
    timestampMs: 500,
    mirrored: true,
    landmarks: [
      {
        name: "nose",
        x: 0.5,
        y: 0.24,
        confidence: 0.95
      },
      {
        name: "left_wrist",
        x: 0.2,
        y: 0.35,
        confidence: 0.93
      },
      {
        name: "right_wrist",
        x: 0.78,
        y: 0.6,
        confidence: 0.9
      }
    ]
  },
  inputEvents: [
    {
      mode: "boxing",
      eventName: "aero:input:boxing-intent",
      summary: "straight_left"
    },
    {
      mode: "boxing",
      eventName: "aero:input:boxing-intent",
      summary: "straight_right"
    },
    {
      mode: "flow",
      eventName: "aero:input:flow-intent",
      summary: "right_wrist cell 3,1"
    }
  ]
});
