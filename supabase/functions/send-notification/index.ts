import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64url helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const raw = atob(base64 + pad);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Simple Web Push using fetch (without npm web-push, using raw VAPID)
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys not configured");
  }

  // Import web-push for Deno
  const webpush = await import("npm:web-push@3.6.7");
  webpush.setVapidDetails("mailto:hello@maluz.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    payload
  );
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

    const { action, template_id, user_ids } = await req.json();

    // Verify admin
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabaseClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_manual") {
      // Get template
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

      // Get subscriptions (all or specific users)
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
      for (const sub of subscriptions || []) {
        try {
          await sendWebPush(sub, payload);
          sent++;
          // Log
          await supabaseClient.from("notification_log").insert({
            user_id: sub.user_id,
            template_id: template.id,
            channel: "push",
            status: "sent",
          });
        } catch (err) {
          failed++;
          console.error("Push failed for", sub.endpoint, err);
          // If 410 Gone, remove the subscription
          if (err?.statusCode === 410) {
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

      // Also send email if channel is 'email' or 'both'
      let emailSent = 0;
      if (template.channel === "email" || template.channel === "both") {
        // Get user emails
        const targetUserIds = user_ids && user_ids.length > 0
          ? user_ids
          : (subscriptions || []).map((s: any) => s.user_id);

        // Get unique user IDs
        const uniqueUserIds = [...new Set(targetUserIds)] as string[];

        // Fetch emails via admin API
        for (const uid of uniqueUserIds) {
          try {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(uid);
            if (userData?.user?.email) {
              const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
              if (RESEND_API_KEY) {
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
                    html: `
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
                    `,
                  }),
                });
                emailSent++;
                await supabaseClient.from("notification_log").insert({
                  user_id: uid,
                  template_id: template.id,
                  channel: "email",
                  status: "sent",
                });
              }
            }
          } catch (err) {
            console.error("Email failed for user", uid, err);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, push_sent: sent, push_failed: failed, email_sent: emailSent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-send: triggered by cron — find inactive users and send
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

        // Find users who haven't had a study session since cutoff
        const { data: inactiveProfiles } = await supabaseClient
          .from("profiles")
          .select("user_id, last_study_date")
          .or(`last_study_date.is.null,last_study_date.lt.${cutoffDate.toISOString().split("T")[0]}`);

        const userIds = [...new Set((inactiveProfiles || []).map((p: any) => p.user_id))];

        // Check notification_log to avoid spamming
        for (const userId of userIds) {
          const { data: recentLog } = await supabaseClient
            .from("notification_log")
            .select("id")
            .eq("user_id", userId)
            .eq("template_id", template.id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (recentLog && recentLog.length > 0) continue;

          // Send push
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
              if (err?.statusCode === 410) {
                await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }

          // Send email if needed
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
                    html: `
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
                    `,
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
