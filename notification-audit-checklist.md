# 🌿 Nook — Notification Audit Checklist

A practical end-to-end test guide for verifying the centralized tone system.
All wording must originate from `src/constants/notificationContent.ts` or `src/constants/emailTemplates.ts`.

---

## ✅ Scenario 1: Join a Nook

**Steps:**
1. Log in as a participant (non-host)
2. Navigate to an active pending Nook
3. Check the safety confirmation checkbox
4. Tap **Request to Join**

**Expected — Toast:**
> Title: `You're in 🌙`
> Body: `You've joined "{topic}". We'll let you know once it's confirmed ✨`

**Expected — notifications table row:**
```json
{
  "type": "join",
  "title": "You're in 🌙",
  "message": "You've joined \"{topic}\". We'll let you know once it's confirmed ✨"
}
```

**Expected — Notification panel UI:**
- Entry appears in /notifications with correct title and body
- Unread badge visible in nav

**Verification checklist:**
- [ ] Toast fires immediately on join success
- [ ] No legacy phrases: "Joined successfully", "You have joined", "Operation completed"
- [ ] Notification panel shows correct copy

---

## ✅ Scenario 2: Host Cancels a Nook

**Steps:**
1. Log in as the host of a confirmed Nook (> 10 hours before start)
2. Open the Nook detail page
3. Tap **Cancel Nook** and confirm

**Expected — Host Toast:**
> Title: `Plans changed 🌿`
> Body: `This Nook has been cancelled. All participants have been notified 🤍`

**Expected — Participant In-App Notification:**
> Title: `Plans changed 🌿`
> Body: `"{topic}" won't be happening this time. You can explore another circle whenever you're ready 🤍`

**Expected — Participant Email:**
> Subject: `Plans changed for your Nook 🌿`
> Body: starts with `Hi {firstName},` → `Just a small update —` → ends with `— Team Nook 💛`

**Expected — Edge function response:**
```json
{ "success": true, "notified_count": N, "emails_sent": N }
```

**Verification checklist:**
- [ ] In-app notification inserted for every approved member
- [ ] Email sent to each approved member via Resend
- [ ] Email ends with `— Team Nook 💛`
- [ ] No legacy phrases: "Your request has been processed", "Cancellation confirmed"
- [ ] Cancel lock blocks cancellation within 10h of start (both client + server)

---

## ✅ Scenario 3: Welcome Email on Signup

**Steps:**
1. Create a new account (email + password or Google)
2. Complete the mandatory gender selection step

**Expected — Email:**
> Subject: `Welcome to Nook 🌙`
> Body:
> `Hi {firstName},`
> `Nook is a small place for real-world circles.`
> `No pressure. No noise. Just calm meetups in public spaces.`
> `You can join one.`
> `Or raise your own.`
> `Take your time exploring 🤍`
> `— Team Nook 💛`

**Verification checklist:**
- [ ] Email received within ~30 seconds of profile creation
- [ ] Email ends with `— Team Nook 💛`
- [ ] No duplicate welcome emails (check `email_logs` table)
- [ ] If user has no email, fails silently (no crash)
- [ ] `email_logs` table has a `welcome` row with `status = 'sent'`

---

## ✅ Scenario 4: Nook Starting Soon Reminder

**Steps:**
1. Have a confirmed Nook scheduled ~2 hours from now
2. Wait for the cron job to run (every 5 minutes)

**Expected — In-App Notification (all approved members):**
> Title: `See you soon 🌿`
> Body: `"{topic}" begins in a couple of hours. Take your time getting there 🤍`

**Verification checklist:**
- [ ] Notification sent to all approved members (including host)
- [ ] `reminder_sent` column set to `true` on nook after first send
- [ ] Cron does NOT send duplicate reminders (idempotent)
- [ ] Only fires for `status = 'confirmed'` nooks

---

## ✅ Scenario 5: Auto-Cancel When Minimum Not Met

**Steps:**
1. Have a pending Nook whose `date_time` has passed with `current_people < min_people`
2. Wait for the cron job to run (every 5 minutes)

**Expected — In-App Notification (all approved + pending members):**
> Title: `This one didn't gather today`
> Body: `"{topic}" didn't reach enough people this time. No worries — you can always raise it again 🌙`

**Expected — Nook record:**
```json
{
  "status": "cancelled",
  "cancelled_at": "<timestamp>",
  "cancelled_by": null
}
```

**Verification checklist:**
- [ ] `status` changed to `cancelled`
- [ ] `cancelled_by` is `null` (system-triggered)
- [ ] All members notified (approved AND pending)
- [ ] No notification sent twice if cron runs again
- [ ] Confirmed nooks are NOT auto-cancelled

---

## 🚫 Anti-Patterns — Must Not Appear Anywhere

Search the codebase for these phrases and ensure none are user-facing:

| Legacy phrase | Replace with |
|---|---|
| `Meetup confirmed` | `It's happening 🌿` |
| `Attendance Confirmed` | `You're here 🌿` |
| `Missed Meetup` | `Life happens 🌙` |
| `Your request` | _(avoid entirely)_ |
| `has been processed` | _(avoid entirely)_ |
| `officially` | _(avoid entirely)_ |
| `Successfully joined` | `You're in 🌙` |
| `Error` (user-facing) | human tone equivalent |
| `Operation completed` | _(avoid entirely)_ |
| `Invalid token signature` | `That QR didn't look right. Please scan the latest one 🌿` |
| `Entry already recorded` | `You're already checked in ✨` |

---

## 📁 Source of Truth Files

- In-app / Toast wording → `src/constants/notificationContent.ts`
- Email wording → `src/constants/emailTemplates.ts`
- QR errors → `QR_ERRORS` in `notificationContent.ts`
- Lock messages → `LOCK_MESSAGES` in `notificationContent.ts`

**Rule:** No hardcoded user-facing strings anywhere in the codebase. All wording must reference these files.
