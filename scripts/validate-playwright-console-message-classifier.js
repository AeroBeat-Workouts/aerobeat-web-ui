// @ts-check

import {
  isAllowedPlaywrightConsoleMessage,
  READ_PIXELS_GPU_STALL_WARNING
} from "./is-allowed-playwright-console-message.js";

const cases = [
  {
    name: "exact locationless Chromium warning",
    tuple: ["warning", READ_PIXELS_GPU_STALL_WARNING, ""],
    expected: true
  },
  {
    name: "wrong log type",
    tuple: ["log", READ_PIXELS_GPU_STALL_WARNING, ""],
    expected: false
  },
  {
    name: "error type",
    tuple: ["error", READ_PIXELS_GPU_STALL_WARNING, ""],
    expected: false
  },
  {
    name: "application URL",
    tuple: ["warning", READ_PIXELS_GPU_STALL_WARNING, "http://127.0.0.1:4173/src/preview.js"],
    expected: false
  },
  {
    name: "relative application path",
    tuple: ["warning", READ_PIXELS_GPU_STALL_WARNING, "/src/preview.js"],
    expected: false
  },
  {
    name: "nonempty browser URL",
    tuple: ["warning", READ_PIXELS_GPU_STALL_WARNING, "chrome://gpu/"],
    expected: false
  },
  {
    name: "text prefix",
    tuple: ["warning", `Unexpected: ${READ_PIXELS_GPU_STALL_WARNING}`, ""],
    expected: false
  },
  {
    name: "text suffix",
    tuple: ["warning", `${READ_PIXELS_GPU_STALL_WARNING}.`, ""],
    expected: false
  },
  {
    name: "composed text",
    tuple: ["warning", `${READ_PIXELS_GPU_STALL_WARNING}\nAnother warning`, ""],
    expected: false
  },
  {
    name: "unrelated warning",
    tuple: ["warning", "WebGL context lost", ""],
    expected: false
  },
  {
    name: "unrelated error",
    tuple: ["error", "Uncaught Error: preview failed", ""],
    expected: false
  }
];

for (const testCase of cases) {
  const [type, text, url] = testCase.tuple;
  const actual = isAllowedPlaywrightConsoleMessage(type, text, url);
  if (actual !== testCase.expected) {
    console.error(`${testCase.name}: expected ${testCase.expected}, received ${actual}`);
    process.exit(1);
  }
}

console.log("Playwright console-message classifier oracle passed.");
