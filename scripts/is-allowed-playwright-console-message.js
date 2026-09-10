// @ts-check

export const READ_PIXELS_GPU_STALL_WARNING = "GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels";

/**
 * Returns whether an exact Playwright console-message tuple is the one
 * locationless Chromium driver warning allowed by the preview validation.
 *
 * @param {string} type
 * @param {string} text
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedPlaywrightConsoleMessage(type, text, url) {
  return type === "warning"
    && text === READ_PIXELS_GPU_STALL_WARNING
    && url === "";
}
