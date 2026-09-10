// @ts-check

export const READ_PIXELS_GPU_STALL_WARNING_BODY = "GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels";
export const READ_PIXELS_GPU_STALL_REPEAT_SUFFIX = " (this message will no longer repeat)";
export const READ_PIXELS_GPU_STALL_WARNING_PATTERN = /^\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels(?: \(this message will no longer repeat\))?$(?![\s\S])/;

/**
 * Returns whether a Playwright console-message tuple is the established
 * Chromium driver warning for one exact validation page.
 *
 * @param {string} type
 * @param {string} text
 * @param {string} url
 * @param {number} lineNumber
 * @param {number} columnNumber
 * @param {string} expectedPageUrl
 * @returns {boolean}
 */
export function isAllowedPlaywrightConsoleMessage(type, text, url, lineNumber, columnNumber, expectedPageUrl) {
  return type === "warning"
    && READ_PIXELS_GPU_STALL_WARNING_PATTERN.test(text)
    && url === expectedPageUrl
    && lineNumber === 0
    && columnNumber === 0;
}
