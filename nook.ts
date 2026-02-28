// Nook core types

export type NookTopic = 
  | "Coffee & Conversation"
  | "Walk & Talk"
  | "Books"
  | "Art & Creativity"
  | "Music"
  | "Discussion"
  | "Learning / Skill Share";

export type NookStatus = "pending" | "confirmed" | "cancelled";

export type NookCategory = "small_circle" | "community";

export const NOOK_CATEGORIES: { value: NookCategory; label: string; emoji: string; maxPeople: number; description: string }[] = [
  { value: "small_circle", label: "Small Circle", emoji: "🌿", maxPeople: 8, description: "A cozy little group for calm conversations and genuine connection 🌙" },
  { value: "community", label: "Community Meetup", emoji: "📚", maxPeople: 15, description: "A friendly group size — more people, but still easy to connect ✨" },
];

export const COMFORT_OPTIONS = [
  "Quiet Space 🌙",
  "Open Seating ☀️",
  "Cozy Café ☕",
  "Outdoor Walk 🌿",
  "Library Vibe 📚",
  "Casual Hangout ✨",
  "Public Meetup 🎉",
] as const;

export type ComfortDetail = typeof COMFORT_OPTIONS[number];

export const COMFORT_VIBE_OPTIONS = [
  "Quiet space",
  "Open seating",
  "Cozy café",
  "Outdoor",
  "Library vibe",
] as const;

export interface Nook {
  id: string;
  topic: NookTopic;
  city: string;
  venue: string;
  dateTime: Date;
  durationMinutes: number;
  minPeople: number;
  maxPeople: number;
  currentPeople: number;
  status: NookStatus;
  createdAt: Date;
  hostId: string;
  category?: NookCategory;
  comfortDetail?: string;
}

export interface NookRequest {
  id: string;
  nookId: string;
  userId: string;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
}

export const NOOK_TOPICS: NookTopic[] = [
  "Coffee & Conversation",
  "Walk & Talk",
  "Books",
  "Art & Creativity",
  "Music",
  "Discussion",
  "Learning / Skill Share",
];

export const NOOK_RULES = [
  "Group meetup only (no 1:1)",
  "Public places only",
  "No dating intent",
  "No selling, MLM, crypto, religion, or politics",
  "Be respectful and kind",
];
