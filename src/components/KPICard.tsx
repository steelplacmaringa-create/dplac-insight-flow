import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/excelParser';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  format?: 'currency' | 'percent' | 'number';
  colorClass?: string;
}

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  format = 'currency',
  colorClass = 'text-primary'
}: KPICardProps) => {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trend > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Card className="p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${colorClass}`}>
            {formatValue()}
          </h3>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${getTrendColor()}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </Card>
  );
};
