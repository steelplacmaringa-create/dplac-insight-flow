import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/excelParser';

interface YearComparisonChartProps {
  data: { year: string; receitas: number; despesas: number }[];
}

export const YearComparisonChart = ({ data }: YearComparisonChartProps) => {
  const chartData = data.map(d => ({
    ano: d.year,
    Receitas: d.receitas,
    Despesas: d.despesas,
    Lucro: d.receitas - d.despesas,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3">
          <p className="font-semibold mb-2">{payload[0].payload.ano}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Comparação entre Anos</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="ano" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={14}
            fontWeight={600}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="Receitas" 
            fill="hsl(var(--success))" 
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
          />
          <Bar 
            dataKey="Despesas" 
            fill="hsl(var(--destructive))" 
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
          />
          <Bar 
            dataKey="Lucro" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
