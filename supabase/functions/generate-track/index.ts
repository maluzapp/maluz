// Edge function: generate-track
// Gera uma sequência de tópicos para uma trilha de aprendizado por matéria + ano escolar
// usando Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBJECT_EMOJIS: Record<string, string> = {
  "Matemática": "🔢",
  "Português": "📝",
  "Ciências": "🔬",
  "História": "🏛️",
  "Geografia": "🌍",
  "Inglês": "🇬🇧",
  "Artes": "🎨",
  "Educação Física": "⚽",
};

interface TopicNode {
  topic: string;
  description: string;
  emoji: string;
}

const NODE_EMOJIS = ["✨", "🌱", "💡", "🌟", "🔮", "🎯", "🚀", "🏆", "👑", "🌈", "⚡", "🎨"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile_id, subject, school_year, expand } = await req.json();
    if (!profile_id || !subject || !school_year) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // verifica posse do perfil
    const { data: profileRow } = await admin
      .from("profiles").select("id, user_id").eq("id", profile_id).single();
    if (!profileRow || profileRow.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // já existe?
    const { data: existing } = await admin
      .from("learning_tracks")
      .select("id")
      .eq("profile_id", profile_id).eq("subject", subject).eq("school_year", school_year)
      .maybeSingle();

    if (existing && !expand) {
      return new Response(JSON.stringify({ track_id: existing.id, created: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // pede para a IA gerar a sequência de tópicos
    let topics: TopicNode[] = [];
    if (LOVABLE_API_KEY) {
      const yearLabel = school_year + "º ano";
      const prompt = `Você é um especialista em educação infantil brasileiro (BNCC). Crie uma trilha de aprendizado progressiva de ${subject} para o ${yearLabel} do Ensino Fundamental.

Retorne EXATAMENTE 10 tópicos sequenciais, do mais simples ao mais complexo, alinhados à BNCC para esse ano.

Cada tópico deve ter:
- "topic": nome curto e direto (máx 30 caracteres, ex: "Soma e Subtração")
- "description": frase encantadora explicando o que a criança vai aprender (máx 80 caracteres)
- "emoji": um único emoji representando o tópico

Retorne APENAS um array JSON válido, sem markdown, sem explicação extra.`;

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Responda apenas com JSON válido conforme solicitado." },
              { role: "user", content: prompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "create_track",
                description: "Cria a trilha com 10 tópicos sequenciais",
                parameters: {
                  type: "object",
                  properties: {
                    topics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          topic: { type: "string" },
                          description: { type: "string" },
                          emoji: { type: "string" },
                        },
                        required: ["topic", "description", "emoji"],
                      },
                    },
                  },
                  required: ["topics"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "create_track" } },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            if (Array.isArray(parsed.topics)) topics = parsed.topics.slice(0, 10);
          }
        } else {
          console.error("AI gateway error:", resp.status, await resp.text());
        }
      } catch (e) {
        console.error("AI call failed:", e);
      }
    }

    // fallback caso IA falhe
    if (topics.length === 0) {
      topics = Array.from({ length: 10 }).map((_, i) => ({
        topic: `${subject} — Etapa ${i + 1}`,
        description: `Avance no seu aprendizado de ${subject}`,
        emoji: NODE_EMOJIS[i % NODE_EMOJIS.length],
      }));
    }

    // cria ou reutiliza trilha
    const subjectEmoji = SUBJECT_EMOJIS[subject] || "📚";
    let trackId: string;
    let startPosition = 0;
    let firstNodeStatus: "available" | "locked" = "available";

    if (existing && expand) {
      trackId = existing.id;
      const { data: lastNode } = await admin
        .from("track_nodes")
        .select("position")
        .eq("track_id", trackId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      startPosition = (lastNode?.position ?? -1) + 1;
      // novos nós sempre nascem locked — o anterior abre o primeiro novo ao ser concluído
      firstNodeStatus = "locked";
    } else {
      const { data: track, error: trackErr } = await admin
        .from("learning_tracks")
        .insert({
          profile_id,
          subject,
          school_year,
          title: `${subjectEmoji} ${subject} — ${school_year}º ano`,
        })
        .select("id").single();
      if (trackErr || !track) throw trackErr;
      trackId = track.id;
    }

    // cria nós
    const nodes = topics.map((t, idx) => ({
      track_id: trackId,
      position: startPosition + idx,
      topic: t.topic.slice(0, 60),
      description: (t.description || "").slice(0, 200),
      emoji: t.emoji || NODE_EMOJIS[idx % NODE_EMOJIS.length],
      status: idx === 0 ? firstNodeStatus : "locked",
    }));
    const { error: nodesErr } = await admin.from("track_nodes").insert(nodes);
    if (nodesErr) throw nodesErr;

    return new Response(JSON.stringify({ track_id: trackId, created: !existing, expanded: !!(existing && expand) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-track error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
