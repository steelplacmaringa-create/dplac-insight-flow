import { Card } from '@/components/ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { getMonthName } from '@/utils/dataProcessing';
import { formatCurrency } from '@/utils/excelParser';

interface RevenueExpenseChartProps {
  data: { month: string; receitas: number; despesas: number }[];
}

export const RevenueExpenseChart = ({ data }: RevenueExpenseChartProps) => {
  const chartData = data.map(d => ({
    month: getMonthName(d.month),
    Receitas: d.receitas,
    Despesas: d.despesas,
    Lucro: d.receitas - d.despesas,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3">
          <p className="font-semibold mb-2">{payload[0].payload.month}</p>
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
      <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas com Tendência</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
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
          <Legend />
          <Bar 
            dataKey="Receitas" 
            fill="hsl(var(--success))" 
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="Despesas" 
            fill="hsl(var(--destructive))" 
            radius={[8, 8, 0, 0]}
          />
          <Line 
            type="monotone" 
            dataKey="Lucro" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};
