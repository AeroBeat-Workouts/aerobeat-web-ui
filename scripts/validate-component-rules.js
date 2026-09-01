// @ts-check

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * @param {string} path
 * @returns {string[]}
 */
function collectFiles(path) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== "node_modules") {
      files.push(...collectFiles(fullPath));
    } else if (entry.endsWith(".html") || entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const failures = [];
const scenesRoot = ".testbed/scenes";
const debugDataRoot = ".testbed/debug-data";
const roots = ["src/screens", ".testbed/scenes"].filter((path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
});

for (const root of roots) {
  for (const file of collectFiles(root)) {
    const source = readFileSync(file, "utf8");
    if (/<(?:button|input|select|textarea)\b/u.test(source)) {
      failures.push(`${file}: visible controls must be named aero-* Web Components`);
    }
  }
}

try {
  if (statSync(scenesRoot).isDirectory()) {
    for (const file of collectFiles(scenesRoot)) {
      if (!file.endsWith(".scene.html")) {
        continue;
      }
      const sceneName = basename(file, ".scene.html");
      const debugDataPath = join(debugDataRoot, `${sceneName}.debug-data.js`);
      try {
        if (!statSync(debugDataPath).isFile()) {
          failures.push(`${file}: expected representative debug data at ${debugDataPath}`);
        }
      } catch {
        failures.push(`${file}: expected representative debug data at ${debugDataPath}`);
      }
    }
  }
} catch {
  // Repos without testbed scenes have nothing to pair.
}

try {
  const transport = readFileSync("src/elements/aero-visual-test-transport/aero-visual-test-transport.js", "utf8");
  for (const role of ["volume-toggle", "music-volume", "sound-volume"]) if (!transport.includes(`data-role=\"${role}\"`)) failures.push(`aero-visual-test-transport: missing named ${role} control`);
  for (const contract of ["aria-controls=\"volume-popover\"", "aria-orientation=\"vertical\"", "role=\"dialog\"", "Music", "Sound"]) if (!transport.includes(contract)) failures.push(`aero-visual-test-transport: missing accessible volume contract ${contract}`);
  for (const forbidden of ["localStorage", "sessionStorage", "AudioContext", "createGain"]) if (transport.includes(forbidden)) failures.push(`aero-visual-test-transport: UI must not own ${forbidden}`);
} catch {
  failures.push("aero-visual-test-transport: component source is missing");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Component-only placeholder check passed.");
