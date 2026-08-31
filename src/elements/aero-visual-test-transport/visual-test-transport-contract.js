// @ts-check

/** Maximum accepted Visual Test duration: 24 hours in milliseconds. */
export const maximumVisualTestDurationMs = 86_400_000;

/**
 * @typedef {Readonly<{
 *   active: boolean,
 *   playing: boolean,
 *   currentMs: number,
 *   durationMs: number
 * }>} AeroVisualTestTransportSnapshot
 */

/** @type {AeroVisualTestTransportSnapshot} */
export const defaultVisualTestTransportSnapshot = Object.freeze({ active: false, playing: false, currentMs: 0, durationMs: 0 });

/**
 * Narrows the exact public transport snapshot without invoking accessors or retaining
 * host-owned objects. Invalid records fail closed to a hidden, paused transport.
 *
 * @param {unknown} value
 * @returns {AeroVisualTestTransportSnapshot}
 */
export function normalizeVisualTestTransportSnapshot(value) {
  if (!isExactDataRecord(value, ["active", "playing", "currentMs", "durationMs"])) return defaultVisualTestTransportSnapshot;
  const active = ownDataValue(value, "active");
  const playing = ownDataValue(value, "playing");
  const currentMs = ownDataValue(value, "currentMs");
  const durationMs = ownDataValue(value, "durationMs");
  if (typeof active !== "boolean" || typeof playing !== "boolean" || !isFiniteNonNegativeNumber(currentMs) || !isFiniteNonNegativeNumber(durationMs)) return defaultVisualTestTransportSnapshot;
  const boundedDurationMs = Math.min(maximumVisualTestDurationMs, Math.round(durationMs));
  const boundedCurrentMs = Math.min(boundedDurationMs, Math.round(currentMs));
  return Object.freeze({ active, playing, currentMs: boundedCurrentMs, durationMs: boundedDurationMs });
}

/**
 * Formats a bounded non-negative millisecond value as total-minutes `mm:ss`.
 *
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatVisualTestTimecode(milliseconds) {
  const bounded = Math.min(maximumVisualTestDurationMs, Math.max(0, Number.isFinite(milliseconds) ? Math.floor(milliseconds) : 0));
  const totalSeconds = Math.floor(bounded / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** @param {unknown} value @returns {value is number} */
function isFiniteNonNegativeNumber(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0; }

/**
 * @param {unknown} value
 * @param {readonly string[]} expectedKeys
 * @returns {value is Record<string, unknown>}
 */
function isExactDataRecord(value, expectedKeys) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== expectedKeys.length || keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))) return false;
  return expectedKeys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(descriptor && "value" in descriptor && descriptor.enumerable);
  });
}

/** @param {Record<string, unknown>} value @param {string} key @returns {unknown} */
function ownDataValue(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
