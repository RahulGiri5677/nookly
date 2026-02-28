// ===============================
// 🌿 NOOK — CENTRALIZED TONE SYSTEM
// In-app notifications & toast messages
// ===============================

export const NOTIFICATIONS = {
  // ---------------------------------
  // 🪺 NOOK LIFECYCLE
  // ---------------------------------
  nookCreated: {
    title: "Your Nook is live 🌙",
    body: () => "It's out there now. Let's see who joins your little circle ✨",
  },
  meetupConfirmed: {
    title: "It's happening 🌿",
    body: (topic: string) =>
      `Enough people joined "${topic}" — your Nook is officially on. See you there 🤍`,
  },
  nookAutoCancelled: {
    title: "This one didn't gather today",
    body: (topic: string) =>
      `"${topic}" didn't reach enough people this time. No worries — you can always raise it again 🌙`,
  },
  nookCancelled: {
    title: "Plans changed 🌿",
    body: (topic: string) =>
      `"${topic}" won't be happening this time. You can explore another circle whenever you're ready 🤍`,
  },
  startingSoon: {
    title: "See you soon 🌿",
    body: (topic: string) =>
      `"${topic}" begins in a couple of hours. Take your time getting there 🤍`,
  },

  // ---------------------------------
  // 👥 JOINING
  // ---------------------------------
  joinSuccess: {
    title: "You're in 🌙",
    body: (topic: string) =>
      `You've joined "${topic}". We'll let you know once it's confirmed ✨`,
  },
  newParticipantHost: {
    title: "Someone just stepped in 🌿",
    body: (topic: string) =>
      `A new person joined "${topic}". It's slowly coming together 🤍`,
  },
  joinRestricted: {
    title: "Let's take a short break 🌙",
    body: (untilDate: string) =>
      `You're temporarily paused from joining new Nooks until ${untilDate}. Showing up builds quiet trust 🌿`,
  },
  hostingRestricted: {
    title: "Let's pause for a bit 🌿",
    body: (untilDate: string) =>
      `You're temporarily paused from hosting until ${untilDate}. When you host, others rely on you 🤍`,
  },

  // ---------------------------------
  // 🚶 ATTENDANCE
  // ---------------------------------
  entryConfirmed: {
    title: "You're here 🌿",
    body: () => "You're checked in. Take a breath and settle in ✨",
  },
  exitConfirmed: {
    title: "Wrapped up nicely 🌙",
    body: () => "Thanks for staying till the end. That matters 🤍",
  },
  fullAttendance: {
    title: "Glad you showed up 🌿",
    body: (topic: string) =>
      `Your presence at "${topic}" has been noted. Circles feel better when people truly show up ✨`,
  },
  firstNoShow: {
    title: "Life happens 🌙",
    body: (topic: string) =>
      `Looks like you missed "${topic}". It's okay — just update your status next time so no one waits for you 🤍`,
  },
  repeatNoShow: {
    title: "We missed you 🌿",
    body: (topic: string) =>
      `You weren't there for "${topic}". Showing up consistently builds your trust circle 🌙`,
  },
  hostNoShow: {
    title: "Hosting carries weight 🌿",
    body: (topic: string) =>
      `"${topic}" didn't have a host present. When you host, others rely on you 🤍`,
  },
  hostExitMissing: {
    title: "Let's close it properly 🌙",
    body: (topic: string) =>
      `The exit scan wasn't completed for "${topic}". Closing the circle fully keeps things smooth for everyone 🤍`,
  },
  feedbackRequest: {
    title: "How did it feel? 🌙",
    body: (topic: string) =>
      `If you'd like, leave a small reflection about "${topic}". Even a few words matter 🤍`,
  },

  // ---------------------------------
  // 🔄 HOST TRANSFER
  // ---------------------------------
  hostTransferSelf: {
    title: "The circle's in your hands 🌙",
    body: () => "The original host couldn't make it. You're now guiding this Nook 🤍",
  },
  hostTransferParticipants: {
    title: "Small shift 🌿",
    body: () => "The host has changed, but the Nook continues. See you there ✨",
  },
  nookCancelledNoHost: {
    title: "This one won't happen today 🌙",
    body: () =>
      "The host couldn't attend and no one else stepped in. You can always join another circle soon 🤍",
  },

  // ---------------------------------
  // 🔐 AUTH (toasts only)
  // ---------------------------------
  magicLinkSent: {
    title: "Check your inbox ✨",
    body: () =>
      "We just sent you a safe little sign-in link. It'll wait for you for 10 minutes 🌙",
  },
  authError: {
    title: "Hmm, that didn't work",
    body: () => "Something felt off there. Try again slowly — we've got you ✨",
  },
  oauthError: {
    title: "Oops… something got tangled 🌿",
    body: () => "That login didn't go through. Let's try one more time 🌿",
  },

  // ---------------------------------
  // 💬 FEEDBACK MODERATION
  // ---------------------------------
  moderationBlocked: {
    title: "Let's keep it kind 🌿",
    body: () => "Try rephrasing that in a respectful way. Nook is a calm space 🤍",
  },

  // ---------------------------------
  // ⚙️ SETTINGS
  // ---------------------------------
  settingsSaved: {
    title: "Saved ✨",
    body: () => "Your notification preferences are updated.",
  },
} as const;

// ---------------------------------
// 🎨 QR / ATTENDANCE ERRORS (user-facing)
// ---------------------------------
export const QR_ERRORS = {
  invalidSignature: "That QR didn't look right. Please scan the latest one 🌿",
  tokenExpired: "That QR just refreshed. Please scan the new one 🌙",
  entryAlreadyRecorded: "You're already checked in ✨",
  exitAlreadyRecorded: "You've already completed the exit scan 🌙",
  entryRequiredFirst: "Scan the entry QR first, then exit 🌿",
  windowNotActive: "The scan window isn't open yet. Check back closer to the meetup time 🌙",
  entryWindowClosed: "The entry window has closed. If you're here, let the host know 🌿",
  exitWindowClosed: "The exit window has closed for this Nook 🌙",
  notApproved: "You're not listed as a participant for this Nook 🌿",
  nookCancelled: "This Nook was cancelled 🌙",
  serverError: "Something went quiet on our end. Try again in a moment 🌿",
  unknownPhase: "Something feels off. Please refresh and try again 🌙",
} as const;

// ---------------------------------
// 🚪 JOIN SAFETY CODES (from check_nook_join_safety)
// ---------------------------------
export const JOIN_SAFETY_MESSAGES: Record<string, { label: string; description: string }> = {
  NOOK_NOT_FOUND: {
    label: "Not Found",
    description: "This Nook could not be found 🌙",
  },
  NOOK_CANCELLED: {
    label: "No Longer Active",
    description: "This Nook is no longer active 🌙",
  },
  MAX_CAPACITY_REACHED: {
    label: "Nook Full",
    description: "This Nook is full 🌿",
  },
  GENDER_RESTRICTED: {
    label: "Reserved",
    description: "This gathering is thoughtfully created for women 🌸",
  },
  GENDER_RATIO_LIMIT: {
    label: "Balancing Participation",
    description: "This Nook is balancing participation to keep the group comfortable 🌿",
  },
  ALREADY_MEMBER: {
    label: "Already Joined",
    description: "You've already joined this Nook ✨",
  },
  USER_SUSPENDED: {
    label: "Temporarily Restricted",
    description: "You're temporarily restricted from joining new Nooks 🌙",
  },
} as const;

// ---------------------------------
// 🔒 CANCELLATION / EDIT LOCK MESSAGES
// ---------------------------------
export const LOCK_MESSAGES = {
  cancelTooClose:
    "This Nook is too close to start time to cancel now 🌙",
  editTooClose:
    "Editing is locked this close to the meetup. If something important changed, please cancel and raise a new one 🌿",
  attendanceTooEarly:
    "Attendance can only be marked during or shortly after the meetup 🌙",
  onlyHostCanCancel: "Only the host can cancel this Nook 🌿",
  alreadyCancelled: "This Nook has already been cancelled 🌙",
} as const;
