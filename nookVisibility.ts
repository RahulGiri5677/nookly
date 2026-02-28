import type { Nook } from "@/types/nook";

/**
 * Returns true if a nook should be visible in Explore (public marketplace).
 * Only shows active, joinable nooks: status pending/confirmed AND not yet ended.
 */
export function isNookVisibleInExplore(nook: Nook, now: Date = new Date()): boolean {
  // Only pending or confirmed nooks are joinable
  if (nook.status !== "pending" && nook.status !== "confirmed") {
    return false;
  }

  const endTime = new Date(nook.dateTime.getTime() + (nook.durationMinutes || 60) * 60 * 1000);

  // Past nooks: hidden
  if (now >= endTime) {
    return false;
  }

  return true;
}

/**
 * Returns true if a nook is still active (not yet ended).
 * Used for My Nooks active vs past separation.
 */
export function isNookActive(nook: Nook, now: Date = new Date()): boolean {
  const endTime = new Date(nook.dateTime.getTime() + (nook.durationMinutes || 60) * 60 * 1000);
  if (now >= endTime) return false;
  if (nook.status === "cancelled") return false;
  return true;
}
