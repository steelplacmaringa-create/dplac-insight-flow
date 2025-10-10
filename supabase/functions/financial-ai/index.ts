import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kpiData, requestType = 'detailed' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    let prompt = '';
    
    if (requestType === 'summary') {
      prompt = `Analise os seguintes KPIs financeiros e forneça insights resumidos em português (Brasil) em no máximo 3 parágrafos curtos:
    
Receita Total: R$ ${kpiData.totalReceita.toFixed(2)}
Despesas Totais: R$ ${kpiData.totalDespesa.toFixed(2)}
Lucro Líquido: R$ ${kpiData.lucroLiquido.toFixed(2)}
Margem de Lucro: ${kpiData.margemLucro.toFixed(2)}%

Seja direto e objetivo. Foque apenas nos pontos mais importantes.`;
    } else {
      prompt = `Você é um especialista em análise financeira. Analise os dados abaixo e forneça insights profissionais:

Receita Total: R$ ${kpiData.totalReceita.toFixed(2)}
Despesa Total: R$ ${kpiData.totalDespesa.toFixed(2)}
Lucro Líquido: R$ ${kpiData.lucroLiquido.toFixed(2)}
Margem de Lucro: ${kpiData.margemLucro.toFixed(2)}%

Forneça uma análise completa incluindo:
1. Avaliação da saúde financeira
2. Identificação de pontos críticos
3. Recomendações estratégicas
4. Oportunidades de melhoria`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um analista financeiro especializado.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const insights = data.choices[0].message.content;

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
