import { Card } from '@/components/ui/card';
import { FinancialTransaction } from '@/types/financial';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/excelParser';

interface SalesYearComparisonProps {
  transactions: FinancialTransaction[];
}

export const SalesYearComparison = ({ transactions }: SalesYearComparisonProps) => {
  // Filter only sales revenue (tipo 'c' and grupo containing 'receita' and 'venda')
  const salesRevenue = transactions.filter(
    t => t.tipo === 'c' && 
    t.grupo.toLowerCase().includes('receita') && 
    t.grupo.toLowerCase().includes('venda')
  );

  // Group by year
  const yearData = salesRevenue.reduce((acc, t) => {
    const year = t.date.getFullYear().toString();
    acc[year] = (acc[year] || 0) + Math.abs(t.valor);
    return acc;
  }, {} as Record<string, number>);

  const years = Object.keys(yearData).sort();
  
  if (years.length < 2) {
    return null;
  }

  // Get first and last year for comparison
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstYearValue = yearData[firstYear];
  const lastYearValue = yearData[lastYear];

  const difference = lastYearValue - firstYearValue;
  const percentageChange = firstYearValue > 0 ? ((difference / firstYearValue) * 100) : 0;
  const isPositive = difference >= 0;

  // Get date range info
  const dateRange = transactions.length > 0 
    ? `${new Date(Math.min(...transactions.map(t => t.date.getTime()))).toLocaleDateString('pt-BR')} até ${new Date(Math.max(...transactions.map(t => t.date.getTime()))).toLocaleDateString('pt-BR')}`
    : '';

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Comparativo de Receita de Vendas Entre Anos</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-effect p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Ano {firstYear}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(firstYearValue)}</p>
          </div>
          
          <div className={`glass-effect p-4 rounded-lg border-2 ${isPositive ? 'border-success' : 'border-destructive'}`}>
            <div className="flex items-center gap-2 mb-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <p className="text-sm text-muted-foreground">
                Variação {firstYear} → {lastYear}
              </p>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{percentageChange.toFixed(2)}%
            </p>
            <p className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(difference))}
            </p>
          </div>

          <div className="glass-effect p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Ano {lastYear}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(lastYearValue)}</p>
          </div>
        </div>

        <div className="glass-effect p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Análise do Período</p>
          <p className="text-sm">
            {isPositive ? (
              <>
                O ano de <span className="font-semibold">{lastYear}</span> teve{' '}
                <span className="font-bold text-success">{formatCurrency(difference)}</span>{' '}
                ({percentageChange.toFixed(2)}%) a mais em Receita de Vendas comparado ao ano de{' '}
                <span className="font-semibold">{firstYear}</span>.
              </>
            ) : (
              <>
                O ano de <span className="font-semibold">{lastYear}</span> teve{' '}
                <span className="font-bold text-destructive">{formatCurrency(Math.abs(difference))}</span>{' '}
                ({Math.abs(percentageChange).toFixed(2)}%) a menos em Receita de Vendas comparado ao ano de{' '}
                <span className="font-semibold">{firstYear}</span>.
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Período analisado: {dateRange}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-sm font-semibold">Ano</th>
                <th className="text-right py-2 px-4 text-sm font-semibold">Receita de Vendas</th>
                <th className="text-right py-2 px-4 text-sm font-semibold">Variação %</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year, index) => {
                const prevYearValue = index > 0 ? yearData[years[index - 1]] : 0;
                const currentValue = yearData[year];
                const yearChange = index > 0 && prevYearValue > 0 
                  ? ((currentValue - prevYearValue) / prevYearValue) * 100 
                  : 0;
                
                return (
                  <tr key={year} className="border-b border-border/50">
                    <td className="py-2 px-4 font-medium">{year}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(currentValue)}</td>
                    <td className={`text-right py-2 px-4 ${
                      index === 0 ? 'text-muted-foreground' : yearChange >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {index === 0 ? '-' : `${yearChange >= 0 ? '+' : ''}${yearChange.toFixed(2)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};
