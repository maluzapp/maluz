import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
} from "jsr:@negrel/webpush@0.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

function b64urlToBytes(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert raw VAPID base64url keys (web-push format) into JWK pair.
// public: 65 bytes uncompressed EC point (0x04 || X(32) || Y(32))
// private: 32 bytes scalar
function vapidRawToJwk(publicB64u: string, privateB64u: string) {
  const pub = b64urlToBytes(publicB64u);
  const priv = b64urlToBytes(privateB64u);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error(`Invalid VAPID public key length=${pub.length} first=${pub[0]}`);
  }
  if (priv.length !== 32) {
    throw new Error(`Invalid VAPID private key length=${priv.length}`);
  }
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  const d = bytesToB64url(priv);
  return {
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true, key_ops: ["verify"] } as JsonWebKey,
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true, key_ops: ["sign"] } as JsonWebKey,
  };
}

let appServerPromise: Promise<ApplicationServer> | null = null;
function getAppServer(): Promise<ApplicationServer> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return Promise.reject(new Error("VAPID keys not configured in secrets"));
  }
  if (!appServerPromise) {
    appServerPromise = (async () => {
      const exported = vapidRawToJwk(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      const vapidKeys = await importVapidKeys(exported, { extractable: false });
      return await ApplicationServer.new({
        contactInformation: "mailto:hello@maluz.app",
        vapidKeys,
      });
    })().catch((e) => {
      appServerPromise = null;
      throw e;
    });
  }
  return appServerPromise;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
) {
  const appServer = await getAppServer();
  const subscriber = appServer.subscribe({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  });
  try {
    await subscriber.pushTextMessage(payload, { ttl: 60 * 60 * 24 });
  } catch (e: any) {
    if (e instanceof PushMessageError) {
      const err: any = new Error(`Push service ${e.response.status}: ${e.toString().slice(0, 200)}`);
      err.statusCode = e.response.status;
      throw err;
    }
    throw e;
  }
}

function buildEmailHtml(template: { icon_emoji: string; title: string; body: string }) {
  return `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;border-radius:50%;background:#FFF3E0;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">${template.icon_emoji}</div>
      </div>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#0d1b2a;text-align:center;margin:0 0 8px;">${template.title}</h1>
      <p style="font-size:14px;color:#555;text-align:center;margin:0 0 24px;line-height:1.6;">${template.body}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://maluz.app/inicio" style="background:#d4a843;color:#0d1b2a;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">Abrir Maluz →</a>
      </div>
      <p style="font-size:12px;color:#999;text-align:center;margin-top:40px;">Maluz — Aprendizado que brilha ✨</p>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { action, template_id, user_ids } = body;

    // Verify auth
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: send_test → sends a test push to the CURRENT USER's own subscriptions
    // No admin requirement — any logged-in user can test their own VAPID setup
    // ──────────────────────────────────────────────────────────
    if (action === "send_test") {
      // Check VAPID config
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return new Response(JSON.stringify({
          ok: false,
          error: "VAPID keys missing",
          vapid_public_set: !!VAPID_PUBLIC_KEY,
          vapid_private_set: !!VAPID_PRIVATE_KEY,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: subs } = await supabaseClient
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id);

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({
          ok: false,
          error: "No push subscriptions found for current user. Click 'Enable push' first.",
          subs_count: 0,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payload = JSON.stringify({
        title: "🧪 Teste de Push — Maluz",
        body: "Se você está vendo isso, suas notificações push estão funcionando! 🎉",
        icon: "/icons/icon-192x192.png",
        data: { url: "/admin" },
      });

      let sent = 0;
      const errors: string[] = [];
      for (const sub of subs) {
        try {
          await sendWebPush(sub, payload);
          sent++;
        } catch (err: any) {
          const msg = err?.message || String(err);
          errors.push(`${err?.statusCode || "?"}: ${msg.slice(0, 200)}`);
          if (err?.statusCode === 410 || err?.statusCode === 404 || err?.statusCode === 403) {
            await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
      return new Response(JSON.stringify({
        ok: sent > 0,
        sent,
        total: subs.length,
        error: sent === 0 && errors.length > 0 ? errors[0] : undefined,
        errors: errors.length > 0 ? errors : undefined,
        vapid_public_prefix: VAPID_PUBLIC_KEY.slice(0, 12) + "...",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // For all other actions → require admin
    const { data: isAdmin } = await supabaseClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_manual") {
      const { data: template, error: tErr } = await supabaseClient
        .from("notification_templates")
        .select("*")
        .eq("id", template_id)
        .single();
      if (tErr || !template) {
        return new Response(JSON.stringify({ error: "Template not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabaseClient.from("push_subscriptions").select("*");
      if (user_ids && user_ids.length > 0) {
        query = query.in("user_id", user_ids);
      }
      const { data: subscriptions } = await query;

      const payload = JSON.stringify({
        title: `${template.icon_emoji} ${template.title}`,
        body: template.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        data: { url: "/inicio" },
      });

      let sent = 0;
      let failed = 0;
      const sampleErrors: string[] = [];
      for (const sub of subscriptions || []) {
        try {
          await sendWebPush(sub, payload);
          sent++;
          await supabaseClient.from("notification_log").insert({
            user_id: sub.user_id,
            template_id: template.id,
            channel: "push",
            status: "sent",
          });
        } catch (err: any) {
          failed++;
          if (sampleErrors.length < 3) {
            sampleErrors.push(`${err?.statusCode || "?"}: ${(err?.message || String(err)).slice(0, 150)}`);
          }
          if (err?.statusCode === 410 || err?.statusCode === 404 || err?.statusCode === 403) {
            await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
          await supabaseClient.from("notification_log").insert({
            user_id: sub.user_id,
            template_id: template.id,
            channel: "push",
            status: "failed",
          });
        }
      }

      // Email channel
      let emailSent = 0;
      if (template.channel === "email" || template.channel === "both") {
        const targetUserIds = user_ids && user_ids.length > 0
          ? user_ids
          : (subscriptions || []).map((s: any) => s.user_id);
        const uniqueUserIds = [...new Set(targetUserIds)] as string[];

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
        for (const uid of uniqueUserIds) {
          try {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(uid);
            if (userData?.user?.email && RESEND_API_KEY) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: "Maluz <hello@maluz.app>",
                  to: [userData.user.email],
                  subject: `${template.icon_emoji} ${template.title}`,
                  html: buildEmailHtml(template),
                }),
              });
              emailSent++;
              await supabaseClient.from("notification_log").insert({
                user_id: uid, template_id: template.id, channel: "email", status: "sent",
              });
            }
          } catch (err) {
            console.error("Email failed for user", uid, err);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          push_sent: sent,
          push_failed: failed,
          email_sent: emailSent,
          subs_total: (subscriptions || []).length,
          sample_errors: sampleErrors.length > 0 ? sampleErrors : undefined,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "auto_inactive") {
      const { data: templates } = await supabaseClient
        .from("notification_templates")
        .select("*")
        .eq("trigger_type", "auto_inactive")
        .eq("is_active", true);

      let totalSent = 0;
      for (const template of templates || []) {
        if (!template.inactive_days) continue;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - template.inactive_days);

        const { data: inactiveProfiles } = await supabaseClient
          .from("profiles")
          .select("user_id, last_study_date")
          .or(`last_study_date.is.null,last_study_date.lt.${cutoffDate.toISOString().split("T")[0]}`);

        const userIds = [...new Set((inactiveProfiles || []).map((p: any) => p.user_id))];

        for (const userId of userIds) {
          const { data: recentLog } = await supabaseClient
            .from("notification_log")
            .select("id")
            .eq("user_id", userId)
            .eq("template_id", template.id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (recentLog && recentLog.length > 0) continue;

          const { data: subs } = await supabaseClient
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", userId);

          const payload = JSON.stringify({
            title: `${template.icon_emoji} ${template.title}`,
            body: template.body,
            icon: "/icons/icon-192x192.png",
            data: { url: "/inicio" },
          });

          for (const sub of subs || []) {
            try {
              await sendWebPush(sub, payload);
              totalSent++;
              await supabaseClient.from("notification_log").insert({
                user_id: userId, template_id: template.id, channel: "push", status: "sent",
              });
            } catch (err: any) {
               if (err?.statusCode === 410 || err?.statusCode === 404 || err?.statusCode === 403) {
                await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }

          if (template.channel === "email" || template.channel === "both") {
            try {
              const { data: userData } = await supabaseClient.auth.admin.getUserById(userId);
              const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
              if (userData?.user?.email && RESEND_API_KEY) {
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                  },
                  body: JSON.stringify({
                    from: "Maluz <hello@maluz.app>",
                    to: [userData.user.email],
                    subject: `${template.icon_emoji} ${template.title}`,
                    html: buildEmailHtml(template),
                  }),
                });
                await supabaseClient.from("notification_log").insert({
                  user_id: userId, template_id: template.id, channel: "email", status: "sent",
                });
              }
            } catch (err) {
              console.error("Auto email failed", err);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, total_sent: totalSent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-notification error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
