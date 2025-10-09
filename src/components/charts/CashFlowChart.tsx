import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMonthName } from '@/utils/dataProcessing';
import { formatCurrency } from '@/utils/excelParser';
import { KPIData } from '@/types/financial';

interface CashFlowChartProps {
  kpiData: KPIData;
}

export const CashFlowChart = ({ kpiData }: CashFlowChartProps) => {
  // Combine and calculate cumulative cash flow
  const monthsMap = new Map<string, { receitas: number; despesas: number }>();
  
  kpiData.receitaPorMes.forEach(r => {
    monthsMap.set(r.month, { receitas: r.value, despesas: 0 });
  });
  
  kpiData.despesaPorMes.forEach(d => {
    const current = monthsMap.get(d.month) || { receitas: 0, despesas: 0 };
    monthsMap.set(d.month, { ...current, despesas: d.value });
  });

  let accumulated = 0;
  const chartData = Array.from(monthsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => {
      const flow = data.receitas - data.despesas;
      accumulated += flow;
      
      return {
        month: getMonthName(month),
        fluxo: accumulated,
      };
    });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3">
          <p className="font-semibold mb-1">{payload[0].payload.month}</p>
          <p className="text-sm text-primary">
            Fluxo Acumulado: {formatCurrency(payload[0].value)}
          </p>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Acumulado</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorFluxo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="fluxo" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorFluxo)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
