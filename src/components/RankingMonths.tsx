import { Card } from '@/components/ui/card';
import { FinancialTransaction } from '@/types/financial';
import { formatCurrency } from '@/utils/excelParser';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RankingMonthsProps {
  transactions: FinancialTransaction[];
}

export const RankingMonths = ({ transactions }: RankingMonthsProps) => {
  const calculateMonthlyData = () => {
    const monthMap = new Map<string, { receitas: number; despesas: number }>();

    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { receitas: 0, despesas: 0 });
      }

      const current = monthMap.get(monthKey)!;
      
      if (t.tipo === 'c') {
        current.receitas += Math.abs(t.valor);
      } else {
        current.despesas += Math.abs(t.valor);
      }
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({ month, ...data }));
  };

  const monthlyData = calculateMonthlyData();

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  // Função para obter meses únicos inteligentemente
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

  // Top 3 Receitas (únicos)
  const topReceitas = getUniqueMonths(monthlyData, (a, b) => b.receitas - a.receitas, 3);

  // Bottom 3 Receitas (únicos)
  const bottomReceitas = getUniqueMonths(monthlyData, (a, b) => a.receitas - b.receitas, 3);

  // Menores Despesas (melhores, únicos)
  const bestDespesas = getUniqueMonths(monthlyData, (a, b) => a.despesas - b.despesas, 3);

  // Maiores Despesas (piores, únicos)
  const worstDespesas = getUniqueMonths(monthlyData, (a, b) => b.despesas - a.despesas, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Ranking de Meses (Receitas)
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-success">Top 3 Meses</h4>
            <div className="space-y-2">
              {topReceitas.map((item, index) => (
                <div key={item.month} className="flex items-center justify-between p-2 bg-success/5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success">#{index + 1}</span>
                    <span className="text-sm">{formatMonth(item.month)}</span>
                  </div>
                  <span className="font-semibold text-success">{formatCurrency(item.receitas)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-destructive">Bottom 3 Meses</h4>
            <div className="space-y-2">
              {bottomReceitas.map((item, index) => (
                <div key={item.month} className="flex items-center justify-between p-2 bg-destructive/5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-destructive">#{index + 1}</span>
                    <span className="text-sm">{formatMonth(item.month)}</span>
                  </div>
                  <span className="font-semibold text-destructive">{formatCurrency(item.receitas)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-destructive" />
          Ranking de Meses (Despesas)
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-success">Melhores (Menores)</h4>
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
            <h4 className="text-sm font-semibold mb-2 text-destructive">Piores (Maiores)</h4>
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
    </div>
  );
};