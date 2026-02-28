import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { token: rawToken } = await req.json();
    if (!rawToken || typeof rawToken !== "object") {
      return json({ error: "Something feels off with that scan 🌿" }, 400);
    }

    const { nook_id, phase, issued_at, expires_at, signature } = rawToken;

    if (!nook_id || !phase || !issued_at || !expires_at || !signature) {
      return json({ error: "That QR didn't look right. Please scan the latest one 🌿" }, 400);
    }

    const signingSecret = Deno.env.get("QR_SIGNING_SECRET");
    if (!signingSecret) return json({ error: "Something went quiet on our end 🌙" }, 500);

    // Step 1: Validate token signature
    const payload = `${nook_id}:${phase}:${issued_at}`;
    const expectedSig = await hmacSign(signingSecret, payload);
    if (expectedSig !== signature) {
      return json({ error: "That QR didn't look right. Please scan the latest one 🌿" }, 400);
    }

    // Step 2: Validate server-side expiry
    const nowUtc = Date.now();
    if (nowUtc > expires_at) {
      return json({ error: "That QR just refreshed. Please scan the new one 🌙" }, 400);
    }

    // Step 3: Fetch nook times
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: nook, error: nookError } = await adminClient
      .from("nooks")
      .select("date_time, duration_minutes, host_id, status")
      .eq("id", nook_id)
      .maybeSingle();

    if (nookError || !nook) return json({ error: "Nook not found 🌙" }, 404);
    if (nook.status === "cancelled") return json({ error: "This Nook was cancelled 🌙" }, 400);

    const startTime = new Date(nook.date_time).getTime();
    const durationMs = (nook.duration_minutes || 60) * 60 * 1000;
    const endTime = startTime + durationMs;

    // Step 4 & 5: Validate time window server-side
    if (phase === "entry") {
      const entryStart = startTime - 15 * 60 * 1000;
      const entryEnd = startTime + 15 * 60 * 1000;
      if (nowUtc < entryStart || nowUtc > entryEnd) {
        return json({ error: "The scan window isn't open yet. Check back closer to the meetup time 🌙" }, 400);
      }
    } else if (phase === "exit") {
      const exitStart = endTime - 15 * 60 * 1000;
      const exitEnd = endTime + 15 * 60 * 1000;
      if (nowUtc < exitStart || nowUtc > exitEnd) {
        return json({ error: "The exit window has closed for this Nook 🌙" }, 400);
      }
    } else {
      return json({ error: "Something feels off. Please refresh and try again 🌙" }, 400);
    }

    // Step 6: Validate user is approved participant
    const { data: membership } = await adminClient
      .from("nook_members")
      .select("id")
      .eq("nook_id", nook_id)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!membership) return json({ error: "You're not listed as a participant for this Nook 🌿" }, 403);

    // Step 7: Check for existing attendance record
    const { data: existing } = await adminClient
      .from("attendance")
      .select("id, entry_marked, exit_marked")
      .eq("nook_id", nook_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (phase === "entry" && existing?.entry_marked) {
      return json({ error: "You're already checked in ✨" }, 400);
    }
    if (phase === "exit" && existing?.exit_marked) {
      return json({ error: "You've already completed the exit scan 🌙" }, 400);
    }
    if (phase === "exit" && !existing?.entry_marked) {
      return json({ error: "Scan the entry QR first, then exit 🌿" }, 400);
    }

    const nowIso = new Date(nowUtc).toISOString();

    if (phase === "entry") {
      if (existing) {
        await adminClient
          .from("attendance")
          .update({ entry_marked: true, entry_time: nowIso, status: "attended", scanned_at: nowIso })
          .eq("id", existing.id);
      } else {
        await adminClient.from("attendance").insert({
          nook_id,
          user_id: user.id,
          status: "attended",
          entry_marked: true,
          entry_time: nowIso,
          scanned_at: nowIso,
        });
      }
      return json({ success: true, phase: "entry", message: "You're checked in. Take a breath and settle in ✨" });
    } else {
      // Exit — mark the record; auto-mark-noshow will finalize after grace period
      const isFullAttendance = !!existing?.entry_marked;
      await adminClient
        .from("attendance")
        .update({
          exit_marked: true,
          exit_time: nowIso,
          status: isFullAttendance ? "attended" : "partial_attendance",
        })
        .eq("id", existing!.id);

      return json({ success: true, phase: "exit", message: "Thanks for staying till the end. That matters 🤍" });
    }
  } catch (err) {
    console.error("verify-attendance error:", err);
    return json({ error: "Something went quiet on our end. Try again in a moment 🌿" }, 500);
  }
});
