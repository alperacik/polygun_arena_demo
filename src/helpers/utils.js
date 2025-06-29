/**
 * @fileoverview Utility functions for common operations used throughout the game.
 * Includes base64 conversion and FPS detection utilities.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

/**
 * Converts a base64 string to an ArrayBuffer
 * @param {string} base64 - The base64 string to convert
 * @returns {ArrayBuffer} The converted ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Detects the frame rate (FPS) from a clip object
 * @param {Object} clip - The clip object containing tracks with timing information
 * @param {Array} clip.tracks - Array of track objects
 * @param {Array} clip.tracks[].times - Array of time values for the track
 * @returns {number} The detected frame rate in FPS, defaults to 30 if detection fails
 */
export function detectFPS(clip) {
  const t = clip.tracks.find((tr) => tr.times.length > 1);
  if (!t) return 30; // safe fallback
  const dt = t.times[1] - t.times[0];
  return Math.round(1 / dt); // → fps
}
