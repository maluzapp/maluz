import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "hello@maluz.app";
const FROM_NAME = "Maluz";

// Default templates — can be overridden via branding_settings (category: email)
const DEFAULT_TEMPLATES: Record<string, { subject: string; html: (vars: Record<string, string>) => string }> = {
  "payment-success": {
    subject: "Pagamento confirmado! 🎉",
    html: (vars) => `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:64px;height:64px;border-radius:50%;background:#E8F5E9;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
        </div>
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#0d1b2a;text-align:center;margin:0 0 8px;">Pagamento confirmado!</h1>
        <p style="font-size:14px;color:#555;text-align:center;margin:0 0 24px;line-height:1.6;">
          Olá${vars.name ? `, ${vars.name}` : ''}! Seu plano <strong>${vars.plan_name || 'Premium'}</strong> está ativo. Aproveite todos os recursos do Maluz!
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${vars.app_url || 'https://maluz.app'}/perfis" style="background:#d4a843;color:#0d1b2a;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
            Ir para meus perfis →
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;margin-top:40px;">
          ${vars.footer_text || 'Maluz — Aprendizado que brilha ✨'}
        </p>
      </div>
    `,
  },
  "welcome": {
    subject: "Bem-vindo(a) ao Maluz! 🌟",
    html: (vars) => `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:64px;height:64px;border-radius:50%;background:#FFF3E0;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🌟</div>
        </div>
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#0d1b2a;text-align:center;margin:0 0 8px;">Bem-vindo(a) ao Maluz!</h1>
        <p style="font-size:14px;color:#555;text-align:center;margin:0 0 24px;line-height:1.6;">
          Olá${vars.name ? `, ${vars.name}` : ''}! Sua conta foi criada com sucesso. Comece agora a explorar exercícios personalizados para aprender de forma divertida.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${vars.app_url || 'https://maluz.app'}/perfis" style="background:#d4a843;color:#0d1b2a;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
            Criar meu primeiro perfil →
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;margin-top:40px;">
          ${vars.footer_text || 'Maluz — Aprendizado que brilha ✨'}
        </p>
      </div>
    `,
  },
  "subscription-cancelled": {
    subject: "Sua assinatura foi cancelada",
    html: (vars) => `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#ffffff;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#0d1b2a;text-align:center;margin:0 0 8px;">Assinatura cancelada</h1>
        <p style="font-size:14px;color:#555;text-align:center;margin:0 0 24px;line-height:1.6;">
          Olá${vars.name ? `, ${vars.name}` : ''}. Sua assinatura do plano ${vars.plan_name || ''} foi cancelada. Você ainda pode usar os recursos até o final do período pago.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${vars.app_url || 'https://maluz.app'}/#planos" style="background:#d4a843;color:#0d1b2a;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
            Reativar assinatura →
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;margin-top:40px;">
          ${vars.footer_text || 'Maluz — Aprendizado que brilha ✨'}
        </p>
      </div>
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, to, variables = {}, subject_override } = await req.json();

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "template and to are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tmpl = DEFAULT_TEMPLATES[template];
    if (!tmpl) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to load custom overrides from branding_settings
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: emailSettings } = await supabaseClient
        .from("branding_settings")
        .select("key, value")
        .eq("category", "email");

      if (emailSettings) {
        for (const s of emailSettings) {
          // Inject branding into variables so templates can use them
          if (!variables[s.key]) {
            variables[s.key] = s.value;
          }
        }
      }
    } catch {
      // Continue with defaults if branding fetch fails
    }

    const htmlContent = tmpl.html(variables);
    const emailSubject = subject_override || tmpl.subject;

    // Send via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: emailSubject,
        html: htmlContent,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send email" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-email error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
