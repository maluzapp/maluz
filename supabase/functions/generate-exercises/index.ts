import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { year, subject, topic, summary, keyPoints } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Map year code to proper label and school level
    function getYearInfo(y: string): { label: string; level: string; ageRange: string } {
      const map: Record<string, { label: string; level: string; ageRange: string }> = {
        '2': { label: '2º ano', level: 'Ensino Fundamental I', ageRange: '7-8 anos' },
        '3': { label: '3º ano', level: 'Ensino Fundamental I', ageRange: '8-9 anos' },
        '4': { label: '4º ano', level: 'Ensino Fundamental I', ageRange: '9-10 anos' },
        '5': { label: '5º ano', level: 'Ensino Fundamental I', ageRange: '10-11 anos' },
        '6': { label: '6º ano', level: 'Ensino Fundamental II', ageRange: '11-12 anos' },
        '7': { label: '7º ano', level: 'Ensino Fundamental II', ageRange: '12-13 anos' },
        '8': { label: '8º ano', level: 'Ensino Fundamental II', ageRange: '13-14 anos' },
        '9': { label: '9º ano', level: 'Ensino Fundamental II', ageRange: '14-15 anos' },
        '1M': { label: '1º ano', level: 'Ensino Médio', ageRange: '15-16 anos' },
        '2M': { label: '2º ano', level: 'Ensino Médio', ageRange: '16-17 anos' },
        '3M': { label: '3º ano', level: 'Ensino Médio', ageRange: '17-18 anos' },
      };
      return map[y] || { label: `${y}º ano`, level: 'Ensino Fundamental II', ageRange: '10-15 anos' };
    }

    const yearInfo = getYearInfo(year);

    const prompt = `Você é um professor do ${yearInfo.label} do ${yearInfo.level}, especialista em criar conteúdo para alunos de ${yearInfo.ageRange}.
Matéria: ${subject}
Assunto: ${topic}
Resumo: ${summary}
Pontos-chave: ${keyPoints?.join(', ') || topic}

Gere EXATAMENTE 8 exercícios variados sobre este conteúdo. Use os seguintes tipos (pelo menos 2 de múltipla escolha, 2 verdadeiro/falso, 2 preencher lacuna, 2 associação):

IMPORTANTE - ADEQUAÇÃO AO NÍVEL ESCOLAR:
- O aluno está no ${yearInfo.label} do ${yearInfo.level} (faixa etária: ${yearInfo.ageRange})
- A linguagem DEVE ser simples e adequada para essa idade
- A complexidade das questões DEVE corresponder ao nível escolar
- Para Fundamental I (2º ao 5º ano): use frases curtas, vocabulário básico, conceitos introdutórios
- Para Fundamental II (6º ao 9º ano): use linguagem intermediária, conceitos mais elaborados
- Para Ensino Médio: use linguagem formal, conceitos avançados

Formato JSON EXATO (retorne APENAS o JSON, sem markdown):
{
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "Pergunta aqui?",
      "options": ["A) opção 1", "B) opção 2", "C) opção 3", "D) opção 4"],
      "correctIndex": 0,
      "explanation": "Explicação breve"
    },
    {
      "type": "true_false",
      "statement": "Afirmação aqui.",
      "correct": true,
      "explanation": "Explicação breve"
    },
    {
      "type": "fill_blank",
      "sentence": "A frase com ___ no lugar da resposta.",
      "answer": "resposta",
      "explanation": "Explicação breve"
    },
    {
      "type": "matching",
      "pairs": [
        {"left": "Conceito 1", "right": "Definição 1"},
        {"left": "Conceito 2", "right": "Definição 2"},
        {"left": "Conceito 3", "right": "Definição 3"}
      ],
      "explanation": "Explicação breve"
    }
  ]
}

REGRAS:
- Exercícios devem ser adequados para alunos do ${yearInfo.label} do ${yearInfo.level} (${yearInfo.ageRange})
- As questões devem cobrir diferentes aspectos do assunto
- Explicações devem ser didáticas e claras, adequadas à faixa etária
- Para fill_blank, use EXATAMENTE "___" (3 underscores) para a lacuna
- Para matching, use exatamente 3 ou 4 pares
- correctIndex começa em 0`;

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
            content: "Você é um professor experiente que cria exercícios escolares. Retorne APENAS JSON válido, sem markdown nem explicações extras.",
          },
          { role: "user", content: prompt },
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

    // Parse JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const parsed = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-exercises error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
