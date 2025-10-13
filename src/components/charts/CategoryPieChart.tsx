import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/excelParser';

interface CategoryPieChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const COLORS = [
  'hsl(220, 85%, 45%)',
  'hsl(145, 65%, 45%)',
  'hsl(35, 90%, 50%)',
  'hsl(200, 85%, 45%)',
  'hsl(280, 70%, 50%)',
  'hsl(10, 80%, 50%)',
  'hsl(180, 70%, 40%)',
  'hsl(50, 90%, 50%)',
];

export const CategoryPieChart = ({ data, title }: CategoryPieChartProps) => {
  const topData = data.slice(0, 8);
  const othersValue = data.slice(8).reduce((sum, item) => sum + item.value, 0);
  
  const chartData = othersValue > 0 
    ? [...topData, { name: 'Outros', value: othersValue }]
    : topData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = (data.value / total * 100).toFixed(1);
      
      return (
        <Card className="p-3">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm text-success">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground">{percentage}%</p>
        </Card>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="40%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                className="transition-all hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ paddingLeft: '10px', fontSize: '11px', maxWidth: '200px' }}
            formatter={(value) => {
              const item = chartData.find(d => d.name === value);
              return `${value}: ${formatCurrency(item?.value || 0)}`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
