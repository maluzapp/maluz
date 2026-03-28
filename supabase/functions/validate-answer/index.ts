import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sentence, expectedAnswer, userAnswer } = await req.json();
    if (!sentence || !expectedAnswer || !userAnswer) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Você é um professor avaliando a resposta de um aluno.

Frase com lacuna: "${sentence}"
Resposta esperada: "${expectedAnswer}"
Resposta do aluno: "${userAnswer}"

A resposta do aluno está correta ou aceitável no contexto da frase? Considere sinônimos, variações de escrita (acentos, maiúsculas/minúsculas), abreviações comuns e respostas que fazem sentido no contexto mesmo que não sejam exatamente a resposta esperada.

Responda APENAS com JSON: {"correct": true/false, "feedback": "explicação breve"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Retorne APENAS JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      // Fallback to exact match on error
      const correct = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
      return new Response(JSON.stringify({ correct, feedback: correct ? "Correto!" : `Resposta esperada: ${expectedAnswer}`, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    try {
      const parsed = JSON.parse(jsonStr.trim());
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      const correct = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
      return new Response(JSON.stringify({ correct, feedback: correct ? "Correto!" : `Resposta esperada: ${expectedAnswer}`, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("validate-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
