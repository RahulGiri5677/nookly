/**
 * Haptic / tactile feedback utilities.
 * Uses the Web Vibration API where available (Android Chrome, some PWA contexts).
 * Gracefully no-ops on iOS Safari (which blocks Vibration API) and desktop.
 */

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // silently ignore
  }
}

/** Light tap — primary button press, menu items */
export const hapticLight = () => vibrate(8);

/** Medium tap — step change, menu open, profile image tap */
export const hapticMedium = () => vibrate(18);

/** Success — Nook raised, important confirmation */
export const hapticSuccess = () => vibrate([12, 40, 20]);

/** Error / warning nudge */
export const hapticError = () => vibrate([20, 30, 20]);
