// ===============================
// 🌿 NOOK — SHARED EMAIL TEMPLATES
// Shared across all edge functions — single source of truth.
// All emails end with: — Team Nook 💛
// Brand color: #2E7D6B | Sender: Team Nook <hello@nookly.me>
// ===============================

const BRAND_COLOR = "#2E7D6B";
const LOGO_URL = "https://qbnzxbxhdmykyzxkxrzv.supabase.co/storage/v1/object/public/profile-photos/nook-avatar.jpg";

export const EMAIL_FROM = "Team Nook <hello@nookly.me>";

function logo(): string {
  return `
    <div style="text-align: center; margin-bottom: 40px;">
      <img
        src="${LOGO_URL}"
        alt="Nook"
        width="56"
        height="56"
        style="display: block; margin: 0 auto; border-radius: 50%; width: 56px; height: 56px; object-fit: cover;"
      />
    </div>
  `;
}

function button(label: string, href: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${href}"
        style="
          display: inline-block;
          background-color: ${BRAND_COLOR};
          color: #ffffff;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 32px;
          border-radius: 100px;
          letter-spacing: 0.02em;
        "
      >${label}</a>
    </div>
  `;
}

function divider(): string {
  return `<hr style="border: none; border-top: 1px solid #f0f0f0; margin: 32px 0;" />`;
}

function wrap(bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafaf8;">
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 480px;
        margin: 0 auto;
        padding: 48px 24px 40px;
        color: #1a1a1a;
        background-color: #ffffff;
      ">
        ${logo()}
        ${bodyContent}
        ${divider()}
        <p style="font-size: 13px; line-height: 1.8; color: #999; margin: 0;">
          — Team Nook 💛
        </p>
        <p style="font-size: 12px; line-height: 1.8; color: #bbb; margin: 8px 0 0;">
          You're receiving this because you have a Nook account.
        </p>
      </div>
    </body>
    </html>
  `;
}

function para(text: string): string {
  return `<p style="font-size: 15px; line-height: 1.9; color: #444; margin: 0 0 16px;">${text}</p>`;
}

// ─── Avatar (optional — only renders if URL provided) ───
function avatar(url?: string): string {
  if (!url || !url.startsWith("https://")) return "";
  return `
    <div style="text-align: center; margin-bottom: 28px;">
      <img
        src="${url}"
        alt="Profile photo"
        width="88"
        height="88"
        style="
          display: inline-block;
          border-radius: 50%;
          width: 88px;
          height: 88px;
          object-fit: cover;
          border: 4px solid ${BRAND_COLOR};
          box-shadow: 0 4px 16px rgba(46, 125, 107, 0.18);
        "
      />
    </div>
  `;
}

// ─── Magic Link ───
export function buildMagicLinkEmail(magicLinkUrl: string, avatarUrl?: string): string {
  return wrap(`
    ${avatar(avatarUrl)}
    ${para("Hi there,")}
    ${para("You're almost in.")}
    ${para("Tap the Magic Link below to step into your circle:")}
    ${button("Open Magic Link ✨", magicLinkUrl)}
    ${para(`<span style="font-size: 13px; color: #999;">This link will stay active for 10 minutes.<br/>If this wasn't you, you can safely ignore this email.</span>`)}
  `);
}

export const MAGIC_LINK_SUBJECT = "Your Magic Link for Nook ✨";

// ─── Welcome ───
export function buildWelcomeEmail(firstName: string): string {
  return wrap(`
    ${para(`Hi ${firstName},`)}
    ${para("Nook is a small place for real-world circles.")}
    ${para("No pressure. No noise. Just calm meetups in public spaces.")}
    ${para("You can join one.")}
    ${para("Or raise your own.")}
    ${para("Take your time exploring 🤍")}
  `);
}

export const WELCOME_SUBJECT = "Welcome to Nook 🌙";

// ─── Cancellation ───
export function buildCancellationEmail(
  firstName: string,
  meetupTitle: string,
  dateStr: string,
  timeStr: string
): string {
  return wrap(`
    ${para(`Hi ${firstName},`)}
    ${para("Just a small update —")}
    ${para(`<strong>"${meetupTitle}"</strong> that was planned for <strong>${dateStr}</strong> at <strong>${timeStr}</strong> won't be happening this time.`)}
    ${para("The host had to cancel.")}
    ${para("Nothing is needed from your side.")}
    ${para("You can explore another Nook whenever it feels right 🤍")}
  `);
}

export const CANCELLATION_SUBJECT = "Plans changed for your Nook 🌿";

// ─── Starting Soon ───
export function buildStartingSoonEmail(firstName: string, meetupTitle: string): string {
  return wrap(`
    ${para(`Hi ${firstName},`)}
    ${para("Just a gentle reminder —")}
    ${para(`<strong>"${meetupTitle}"</strong> begins in a couple of hours.`)}
    ${para("No rush. Just come as you are.")}
  `);
}

export const STARTING_SOON_SUBJECT = "See you soon 🌿";
