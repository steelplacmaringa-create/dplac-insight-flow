import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, TrendingUp, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KPIData } from '@/types/financial';

interface AIInsightsProps {
  kpiData: KPIData;
}

export const AIInsights = ({ kpiData }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-ai', {
        body: { kpiData }
      });

      if (error) throw error;
      setInsights(data.insights);
      toast.success('Insights gerados com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Insights Financeiros com IA
        </h3>
        <Button onClick={generateInsights} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Insights'}
        </Button>
      </div>
      
      {insights ? (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{insights}</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Clique em "Gerar Insights" para uma análise detalhada dos seus dados financeiros.
        </p>
      )}
    </Card>
  );
};
