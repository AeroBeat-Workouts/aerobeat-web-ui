// @ts-check

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  defaultVisualTestTransportSnapshot,
  formatVisualTestTimecode,
  maximumVisualTestDurationMs,
  normalizeVisualTestTransportSnapshot
} from "../src/elements/aero-visual-test-transport/visual-test-transport-contract.js";

const valid = normalizeVisualTestTransportSnapshot({ active: true, playing: true, currentMs: 61_999.6, durationMs: 180_000.2 });
assert.deepEqual(valid, { active: true, playing: true, currentMs: 62_000, durationMs: 180_000 });
assert.equal(Object.isFrozen(valid), true, "Normalized transport state is mutable.");

assert.deepEqual(normalizeVisualTestTransportSnapshot({ active: true, playing: false, currentMs: 5000, durationMs: 3000 }), { active: true, playing: false, currentMs: 3000, durationMs: 3000 }, "Current time did not clamp to duration.");
assert.deepEqual(normalizeVisualTestTransportSnapshot({ active: true, playing: false, currentMs: maximumVisualTestDurationMs + 1, durationMs: maximumVisualTestDurationMs + 1 }), { active: true, playing: false, currentMs: maximumVisualTestDurationMs, durationMs: maximumVisualTestDurationMs }, "Transport duration bound was not enforced.");
assert.equal(normalizeVisualTestTransportSnapshot(null), defaultVisualTestTransportSnapshot);
for (const malformed of [
  {},
  { active: true, playing: false, currentMs: 0, durationMs: 1, service: {} },
  { active: 1, playing: false, currentMs: 0, durationMs: 1 },
  { active: true, playing: false, currentMs: -1, durationMs: 1 },
  { active: true, playing: false, currentMs: 0, durationMs: Number.NaN },
  new (class TransportState { constructor() { this.active = true; this.playing = false; this.currentMs = 0; this.durationMs = 1; } })()
]) assert.equal(normalizeVisualTestTransportSnapshot(malformed), defaultVisualTestTransportSnapshot, "Malformed transport state did not fail closed.");

let getterCalls = 0;
const accessorState = { active: true, playing: false, currentMs: 0 };
Object.defineProperty(accessorState, "durationMs", { enumerable: true, get() { getterCalls += 1; return 10_000; } });
assert.equal(normalizeVisualTestTransportSnapshot(accessorState), defaultVisualTestTransportSnapshot);
assert.equal(getterCalls, 0, "Transport normalization executed an accessor.");
const symbolState = { active: true, playing: false, currentMs: 0, durationMs: 10_000 };
symbolState[Symbol("service")] = new Uint8Array([1]);
assert.equal(normalizeVisualTestTransportSnapshot(symbolState), defaultVisualTestTransportSnapshot, "Symbol-bearing state crossed the exact boundary.");

assert.equal(formatVisualTestTimecode(0), "00:00");
assert.equal(formatVisualTestTimecode(61_999), "01:01");
assert.equal(formatVisualTestTimecode(7_205_000), "120:05");
assert.equal(formatVisualTestTimecode(Number.NaN), "00:00");

const componentSource = readFileSync("src/elements/aero-visual-test-transport/aero-visual-test-transport.js", "utf8");
const packageSource = readFileSync("package.json", "utf8");
for (const intent of ["visual-test-play", "visual-test-pause", "visual-test-seek"]) assert.ok(componentSource.includes(`\"${intent}\"`), `Missing ${intent} contract.`);
assert.ok(componentSource.includes("Object.freeze({ type, payload: Object.freeze"), "Transport intent detail/payload is not immutable.");
assert.ok(componentSource.includes("prefers-reduced-motion: reduce") && componentSource.includes("env(safe-area-inset-bottom)"), "Reduced-motion or safe-area contract is missing.");
assert.ok(packageSource.includes('"./elements/aero-visual-test-transport"'), "Transport subpath export is missing.");
for (const forbidden of ["Audio", "MediaStream", "Blob", "File", "packageId", "eventId", "service"]) assert.equal(componentSource.includes(forbidden), false, `Transport component retains forbidden host data term ${forbidden}.`);

console.log("Visual Test transport public contract validation passed.");
