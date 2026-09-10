// @ts-check

import assert from "node:assert/strict";
import {
  isAllowedPlaywrightConsoleMessage,
  READ_PIXELS_GPU_STALL_REPEAT_SUFFIX,
  READ_PIXELS_GPU_STALL_WARNING_BODY
} from "./is-allowed-playwright-console-message.js";

const expectedPageUrl = "http://127.0.0.1:4173/.testbed/demo/media-pose-preview-validation.html";
const warning = `[.WebGL-0x12ab09]${READ_PIXELS_GPU_STALL_WARNING_BODY}`;
const repeatedWarning = `${warning}${READ_PIXELS_GPU_STALL_REPEAT_SUFFIX}`;
const accepts = (type, text, url, lineNumber, columnNumber, expectedUrl = expectedPageUrl) => (
  isAllowedPlaywrightConsoleMessage(type, text, url, lineNumber, columnNumber, expectedUrl)
);

assert.equal(accepts("warning", warning, expectedPageUrl, 0, 0), true, "exact Chromium warning");
assert.equal(accepts("warning", repeatedWarning, expectedPageUrl, 0, 0), true, "exact repeat-ending warning");
assert.equal(accepts("warning", warning, expectedPageUrl, 0, 0), true, "duplicate exact warning remains accepted");

const adversaries = [
  ["log", warning, expectedPageUrl, 0, 0, expectedPageUrl, "wrong log type"],
  ["error", warning, expectedPageUrl, 0, 0, expectedPageUrl, "error type"],
  ["warning", `[.WebGL-0x]${READ_PIXELS_GPU_STALL_WARNING_BODY}`, expectedPageUrl, 0, 0, expectedPageUrl, "empty context id"],
  ["warning", `[.WebGL-0xAB12]${READ_PIXELS_GPU_STALL_WARNING_BODY}`, expectedPageUrl, 0, 0, expectedPageUrl, "uppercase context id"],
  ["warning", `[.WebGL-0x12xz]${READ_PIXELS_GPU_STALL_WARNING_BODY}`, expectedPageUrl, 0, 0, expectedPageUrl, "nonhex context id"],
  ["warning", `Unexpected: ${warning}`, expectedPageUrl, 0, 0, expectedPageUrl, "text prefix"],
  ["warning", `${warning}.`, expectedPageUrl, 0, 0, expectedPageUrl, "text suffix"],
  ["warning", `${warning}\nAnother warning`, expectedPageUrl, 0, 0, expectedPageUrl, "composed text"],
  ["warning", `${warning}\n`, expectedPageUrl, 0, 0, expectedPageUrl, "trailing newline"],
  ["warning", `${warning} (this message may no longer repeat)`, expectedPageUrl, 0, 0, expectedPageUrl, "mutated repeat suffix"],
  ["warning", READ_PIXELS_GPU_STALL_WARNING_BODY, expectedPageUrl, 0, 0, expectedPageUrl, "missing Chromium context prefix"],
  ["warning", warning, "http://localhost:4173/.testbed/demo/media-pose-preview-validation.html", 0, 0, expectedPageUrl, "wrong URL origin"],
  ["warning", warning, "http://127.0.0.1:4174/.testbed/demo/media-pose-preview-validation.html", 0, 0, expectedPageUrl, "wrong URL port"],
  ["warning", warning, "http://127.0.0.1:4173/.testbed/demo/other.html", 0, 0, expectedPageUrl, "wrong URL path"],
  ["warning", warning, expectedPageUrl, 1, 0, expectedPageUrl, "same-page application line"],
  ["warning", warning, expectedPageUrl, 0, 1, expectedPageUrl, "same-page application column"],
  ["warning", warning, expectedPageUrl, 0, 0, "http://127.0.0.1:4173/.testbed/demo/other.html", "wrong expected page URL"],
  ["warning", "WebGL context lost", expectedPageUrl, 0, 0, expectedPageUrl, "unrelated warning"],
  ["error", "Uncaught Error: preview failed", expectedPageUrl, 0, 0, expectedPageUrl, "unrelated error"]
];

for (const [type, text, url, lineNumber, columnNumber, expectedUrl, label] of adversaries) {
  assert.equal(accepts(type, text, url, lineNumber, columnNumber, expectedUrl), false, label);
}

console.log("Playwright console-message classifier oracle passed.");
