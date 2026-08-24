// @ts-check

import { AeroButton, defineAeroButton } from "./elements/aero-button/aero-button.js";
import { AeroMediaPosePreview, defineAeroMediaPosePreview } from "./elements/aero-media-pose-preview/aero-media-pose-preview.js";
import { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
import { AeroSelect, defineAeroSelect } from "./elements/aero-select/aero-select.js";
import { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
import { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

export { AeroButton, aeroButtonActivateEventName, defineAeroButton } from "./elements/aero-button/aero-button.js";
export {
  AeroMediaPosePreview,
  aeroPosePreviewSkeletonConnections,
  defineAeroMediaPosePreview
} from "./elements/aero-media-pose-preview/aero-media-pose-preview.js";
export { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
export { AeroSelect, aeroSelectChangeEventName, defineAeroSelect } from "./elements/aero-select/aero-select.js";
export { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
export { AeroCalibrationScreen, aeroCalibrationEventNames, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

/**
 * Defines the starter AeroBeat Web Components for scenes and consumers.
 *
 * @returns {void}
 */
export function defineAeroUiElements() {
  defineAeroButton();
  defineAeroMediaPosePreview();
  defineAeroPoseFlowPanel();
  defineAeroSelect();
  defineAeroStatusPanel();
  defineAeroCalibrationScreen();
}

/**
 * Starter element constructors keyed by custom element name.
 *
 * @type {Readonly<{
 *   aeroButton: typeof AeroButton,
 *   aeroMediaPosePreview: typeof AeroMediaPosePreview,
 *   aeroPoseFlowPanel: typeof AeroPoseFlowPanel,
 *   aeroSelect: typeof AeroSelect,
 *   aeroStatusPanel: typeof AeroStatusPanel,
 *   aeroCalibrationScreen: typeof AeroCalibrationScreen
 * }>}
 */
export const aeroUiConstructors = Object.freeze({
  aeroButton: AeroButton,
  aeroMediaPosePreview: AeroMediaPosePreview,
  aeroPoseFlowPanel: AeroPoseFlowPanel,
  aeroSelect: AeroSelect,
  aeroStatusPanel: AeroStatusPanel,
  aeroCalibrationScreen: AeroCalibrationScreen
});
