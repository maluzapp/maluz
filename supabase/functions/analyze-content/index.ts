import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { year, subject, topic, images, audio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build content parts for the AI
    const userContentParts: any[] = [
      {
        type: "text",
        text: `Analise o seguinte conteúdo escolar e retorne um resumo estruturado.

Ano: ${year}º ano do Ensino Fundamental II
Matéria: ${subject}
Assunto: ${topic}

Retorne EXATAMENTE neste formato JSON (e nada mais):
{
  "title": "Título claro do conteúdo",
  "summary": "Resumo de 2-3 frases sobre o conteúdo",
  "keyPoints": ["ponto chave 1", "ponto chave 2", "ponto chave 3", "ponto chave 4"]
}`,
      },
    ];

    // Add images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.startsWith("data:")) {
          const [meta, base64] = img.split(",");
          const mimeType = meta.match(/data:(.*);/)?.[1] || "image/jpeg";
          userContentParts.push({
            type: "image_url",
            image_url: { url: img },
          });
        }
      }
      userContentParts[0].text += "\n\nAs imagens acima são páginas do livro didático. Analise-as junto com o assunto informado.";
    }

    // Add audio context if provided
    if (audio) {
      userContentParts[0].text += "\n\nO aluno também gravou um áudio resumindo a matéria. Considere esse contexto adicional na análise.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Você é um professor experiente do Ensino Fundamental II brasileiro. Analise conteúdos escolares e retorne resumos estruturados em JSON. Responda APENAS com JSON válido, sem markdown.",
          },
          {
            role: "user",
            content: userContentParts,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no Lovable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    const summary = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
