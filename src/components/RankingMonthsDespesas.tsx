import { Card } from '@/components/ui/card';
import { FinancialTransaction } from '@/types/financial';
import { formatCurrency } from '@/utils/excelParser';
import { TrendingDown } from 'lucide-react';

interface RankingMonthsDespesasProps {
  transactions: FinancialTransaction[];
}

export const RankingMonthsDespesas = ({ transactions }: RankingMonthsDespesasProps) => {
  const calculateMonthlyDespesas = () => {
    const monthMap = new Map<string, number>();

    transactions.forEach(t => {
      if (t.tipo === 'd') {
        const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, 0);
        }

        monthMap.set(monthKey, monthMap.get(monthKey)! + Math.abs(t.valor));
      }
    });

    return Array.from(monthMap.entries()).map(([month, despesas]) => ({ month, despesas }));
  };

  const monthlyData = calculateMonthlyDespesas();

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const getUniqueMonths = (data: typeof monthlyData, sortFn: (a: typeof monthlyData[0], b: typeof monthlyData[0]) => number, limit: number = 3) => {
    const sorted = [...data].sort(sortFn);
    const unique: typeof monthlyData = [];
    const seenMonths = new Set<string>();
    
    for (const item of sorted) {
      if (!seenMonths.has(item.month)) {
        unique.push(item);
        seenMonths.add(item.month);
        if (unique.length >= limit) break;
      }
    }
    
    return unique;
  };

  const bestDespesas = getUniqueMonths(monthlyData, (a, b) => a.despesas - b.despesas, 3);
  const worstDespesas = getUniqueMonths(monthlyData, (a, b) => b.despesas - a.despesas, 3);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-destructive" />
        Ranking de Meses - Despesas
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-success">Melhores Meses (Menores Despesas)</h4>
          <div className="space-y-2">
            {bestDespesas.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between p-2 bg-success/5 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-success">#{index + 1}</span>
                  <span className="text-sm">{formatMonth(item.month)}</span>
                </div>
                <span className="font-semibold text-success">{formatCurrency(item.despesas)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-destructive">Piores Meses (Maiores Despesas)</h4>
          <div className="space-y-2">
            {worstDespesas.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between p-2 bg-destructive/5 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-destructive">#{index + 1}</span>
                  <span className="text-sm">{formatMonth(item.month)}</span>
                </div>
                <span className="font-semibold text-destructive">{formatCurrency(item.despesas)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
