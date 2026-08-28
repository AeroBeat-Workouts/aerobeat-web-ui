// @ts-check

import { AeroButton, defineAeroButton } from "./elements/aero-button/aero-button.js";
import { AeroMediaPosePreview, defineAeroMediaPosePreview } from "./elements/aero-media-pose-preview/aero-media-pose-preview.js";
import { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
import {
  AeroBackgroundEnvironment,
  AeroBeatSaverBrowser,
  AeroBoxingSpatialHud,
  AeroBoxingTrackHud,
  AeroCalibrationBadge,
  AeroCapabilitiesPanel,
  AeroContentImportProgress,
  AeroContentLibrary,
  AeroErrorPanel,
  AeroFlowHud,
  AeroFullscreenButton,
  AeroGridPlayfield,
  AeroPrototypeSelector,
  AeroResumeCountdown,
  AeroTrackingPause,
  defineAeroProductPresenters
} from "./elements/aero-product-presenters.js";
import { AeroSelect, defineAeroSelect } from "./elements/aero-select/aero-select.js";
import { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
import { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

export { AeroButton, aeroButtonActivateEventName, defineAeroButton } from "./elements/aero-button/aero-button.js";
export { AeroMediaPosePreview, aeroPosePreviewSkeletonConnections, defineAeroMediaPosePreview } from "./elements/aero-media-pose-preview/aero-media-pose-preview.js";
export { AeroPoseFlowPanel, defineAeroPoseFlowPanel } from "./elements/aero-pose-flow-panel/aero-pose-flow-panel.js";
export {
  AeroBackgroundEnvironment,
  AeroBeatSaverBrowser,
  AeroBoxingSpatialHud,
  AeroBoxingTrackHud,
  AeroCalibrationBadge,
  AeroCapabilitiesPanel,
  AeroContentImportProgress,
  AeroContentLibrary,
  AeroErrorPanel,
  AeroFlowHud,
  AeroFullscreenButton,
  AeroGridPlayfield,
  AeroPrototypeSelector,
  AeroResumeCountdown,
  AeroTrackingPause,
  aeroProductPresenterConstructors,
  aeroUiIntentEventName,
  defineAeroProductPresenters
} from "./elements/aero-product-presenters.js";
export { AeroSelect, aeroSelectChangeEventName, defineAeroSelect } from "./elements/aero-select/aero-select.js";
export { AeroStatusPanel, defineAeroStatusPanel } from "./elements/aero-status-panel/aero-status-panel.js";
export { AeroCalibrationScreen, defineAeroCalibrationScreen } from "./screens/aero-calibration-screen/aero-calibration-screen.js";

/** Defines every public AeroBeat UI component idempotently. @returns {void} */
export function defineAeroUiElements() {
  defineAeroButton();
  defineAeroMediaPosePreview();
  defineAeroPoseFlowPanel();
  defineAeroProductPresenters();
  defineAeroSelect();
  defineAeroStatusPanel();
  defineAeroCalibrationScreen();
}

/** Public constructors keyed by custom-element name. */
export const aeroUiConstructors = Object.freeze({
  aeroButton: AeroButton,
  aeroMediaPosePreview: AeroMediaPosePreview,
  aeroPoseFlowPanel: AeroPoseFlowPanel,
  aeroSelect: AeroSelect,
  aeroStatusPanel: AeroStatusPanel,
  aeroCalibrationScreen: AeroCalibrationScreen,
  aeroBeatSaverBrowser: AeroBeatSaverBrowser,
  aeroContentImportProgress: AeroContentImportProgress,
  aeroContentLibrary: AeroContentLibrary,
  aeroCalibrationBadge: AeroCalibrationBadge,
  aeroGridPlayfield: AeroGridPlayfield,
  aeroFlowHud: AeroFlowHud,
  aeroBoxingTrackHud: AeroBoxingTrackHud,
  aeroBoxingSpatialHud: AeroBoxingSpatialHud,
  aeroTrackingPause: AeroTrackingPause,
  aeroResumeCountdown: AeroResumeCountdown,
  aeroBackgroundEnvironment: AeroBackgroundEnvironment,
  aeroFullscreenButton: AeroFullscreenButton,
  aeroCapabilitiesPanel: AeroCapabilitiesPanel,
  aeroErrorPanel: AeroErrorPanel,
  aeroPrototypeSelector: AeroPrototypeSelector
});
