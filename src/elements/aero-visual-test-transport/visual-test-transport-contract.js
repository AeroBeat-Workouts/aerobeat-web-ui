// @ts-check

/** Maximum accepted Visual Test duration: 24 hours in milliseconds. */
export const maximumVisualTestDurationMs = 86_400_000;
/** Default bounded Music/Sound volume. */
export const defaultVisualTestVolume = 0.5;
/** Native volume range increment. */
export const visualTestVolumeStep = 0.01;
/** Inclusive magnetic distance from 0, 0.5, and 1. */
export const visualTestVolumeSnapThreshold = 0.04;
const visualTestVolumeAnchors = Object.freeze([0, 0.5, 1]);

/**
 * @typedef {Readonly<{
 *   active: boolean,
 *   playing: boolean,
 *   currentMs: number,
 *   durationMs: number,
 *   musicVolume: number,
 *   soundVolume: number
 * }>} AeroVisualTestTransportSnapshot
 */

/** @type {AeroVisualTestTransportSnapshot} */
export const defaultVisualTestTransportSnapshot = Object.freeze({ active: false, playing: false, currentMs: 0, durationMs: 0, musicVolume: defaultVisualTestVolume, soundVolume: defaultVisualTestVolume });

/**
 * Clamps one finite scalar to the native 0..1/0.01 range and applies an
 * inclusive magnetic snap within 0.04 of 0, 0.5, or 1. Invalid values reject.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function snapVisualTestVolume(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const bounded = Math.min(1, Math.max(0, value));
  for (const anchor of visualTestVolumeAnchors) if (Math.abs(bounded - anchor) <= visualTestVolumeSnapThreshold + Number.EPSILON) return anchor;
  const stepScale = Math.round(1 / visualTestVolumeStep);
  const roundedStep = Math.round((bounded + Number.EPSILON) * stepScale) / stepScale;
  return Number(roundedStep.toFixed(2));
}

/**
 * Narrows the exact public transport snapshot without invoking accessors or retaining
 * host-owned objects. Invalid records fail closed to a hidden, paused transport.
 *
 * @param {unknown} value
 * @returns {AeroVisualTestTransportSnapshot}
 */
export function normalizeVisualTestTransportSnapshot(value) {
  if (!isExactDataRecord(value, ["active", "playing", "currentMs", "durationMs", "musicVolume", "soundVolume"])) return defaultVisualTestTransportSnapshot;
  const active = ownDataValue(value, "active");
  const playing = ownDataValue(value, "playing");
  const currentMs = ownDataValue(value, "currentMs");
  const durationMs = ownDataValue(value, "durationMs");
  const musicVolume = snapVisualTestVolume(ownDataValue(value, "musicVolume"));
  const soundVolume = snapVisualTestVolume(ownDataValue(value, "soundVolume"));
  if (typeof active !== "boolean" || typeof playing !== "boolean" || !isFiniteNonNegativeNumber(currentMs) || !isFiniteNonNegativeNumber(durationMs) || musicVolume === null || soundVolume === null) return defaultVisualTestTransportSnapshot;
  const boundedDurationMs = Math.min(maximumVisualTestDurationMs, Math.round(durationMs));
  const boundedCurrentMs = Math.min(boundedDurationMs, Math.round(currentMs));
  return Object.freeze({ active, playing, currentMs: boundedCurrentMs, durationMs: boundedDurationMs, musicVolume, soundVolume });
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
