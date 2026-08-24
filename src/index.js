// @ts-check

import { AeroButton, defineAeroButton } from "./elements/aero-button/aero-button.js";
import { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
import { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
import { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

export { AeroButton, aeroButtonActivateEventName, defineAeroButton } from "./elements/aero-button/aero-button.js";
export { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
export { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
export { AeroCalibrationScreen, aeroCalibrationEventNames, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

/**
 * Defines the starter AeroBeat Web Components for scenes and consumers.
 *
 * @returns {void}
 */
export function defineAeroUiElements() {
  defineAeroButton();
  defineAeroPoseFlowPanel();
  defineAeroStatusPanel();
  defineAeroCalibrationScreen();
}

/**
 * Starter element constructors keyed by custom element name.
 *
 * @type {Readonly<{
 *   aeroButton: typeof AeroButton,
 *   aeroPoseFlowPanel: typeof AeroPoseFlowPanel,
 *   aeroStatusPanel: typeof AeroStatusPanel,
 *   aeroCalibrationScreen: typeof AeroCalibrationScreen
 * }>}
 */
export const aeroUiConstructors = Object.freeze({
  aeroButton: AeroButton,
  aeroPoseFlowPanel: AeroPoseFlowPanel,
  aeroStatusPanel: AeroStatusPanel,
  aeroCalibrationScreen: AeroCalibrationScreen
});
