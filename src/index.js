// @ts-check

import { AeroButton, defineAeroButton } from "./elements/aero-button/aero-button.js";
import { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
import { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

export { AeroButton, defineAeroButton } from "./elements/aero-button/aero-button.js";
export { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
export { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

/**
 * Defines the starter AeroBeat Web Components for scenes and consumers.
 *
 * @returns {void}
 */
export function defineAeroUiElements() {
  defineAeroButton();
  defineAeroStatusPanel();
  defineAeroCalibrationScreen();
}

/**
 * Starter element constructors keyed by custom element name.
 *
 * @type {Readonly<{
 *   aeroButton: typeof AeroButton,
 *   aeroStatusPanel: typeof AeroStatusPanel,
 *   aeroCalibrationScreen: typeof AeroCalibrationScreen
 * }>}
 */
export const aeroUiConstructors = Object.freeze({
  aeroButton: AeroButton,
  aeroStatusPanel: AeroStatusPanel,
  aeroCalibrationScreen: AeroCalibrationScreen
});
