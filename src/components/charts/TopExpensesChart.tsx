import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/excelParser';

interface TopExpensesChartProps {
  data: { name: string; value: number }[];
}

export const TopExpensesChart = ({ data }: TopExpensesChartProps) => {
  const topData = data.slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3">
          <p className="font-semibold mb-1">{payload[0].payload.name}</p>
          <p className="text-sm text-destructive">{formatCurrency(payload[0].value)}</p>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top 10 Despesas por Subgrupo</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={topData} 
          layout="vertical"
          margin={{ left: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category"
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--destructive))" 
            radius={[0, 8, 8, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
