import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDurationHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${hours} hours`;
}
