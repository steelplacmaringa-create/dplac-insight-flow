import { FinancialTransaction, FilterState, KPIData } from '@/types/financial';

export const filterTransactions = (
  transactions: FinancialTransaction[],
  filters: FilterState
): FinancialTransaction[] => {
  return transactions.filter(t => {
    // Filter by empresa
    if (filters.empresas.length > 0 && !filters.empresas.includes(t.empresa)) {
      return false;
    }

    // Filter by grupo
    if (filters.grupos.length > 0 && !filters.grupos.includes(t.grupo)) {
      return false;
    }

    // Filter by subgrupo
    if (filters.subgrupos.length > 0 && !filters.subgrupos.includes(t.subgrupo)) {
      return false;
    }

    // Filter by tipo
    if (filters.tipo && filters.tipo.length > 0 && !filters.tipo.includes(t.tipo)) {
      return false;
    }

    // Filter by date range
    if (filters.startDate && t.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && t.date > filters.endDate) {
      return false;
    }

    return true;
  });
};

export const calculateKPIs = (transactions: FinancialTransaction[]): KPIData => {
  const receitas = transactions.filter(t => t.tipo === 'c');
  const despesas = transactions.filter(t => t.tipo === 'd');

  const totalReceita = receitas.reduce((sum, t) => sum + t.valor, 0);
  const totalDespesa = Math.abs(despesas.reduce((sum, t) => sum + t.valor, 0));
  const lucroLiquido = totalReceita - totalDespesa;
  const margemLucro = totalReceita > 0 ? (lucroLiquido / totalReceita) * 100 : 0;

  // Group by month
  const receitaPorMes = groupByMonth(receitas);
  const despesaPorMes = groupByMonth(despesas.map(d => ({ ...d, valor: Math.abs(d.valor) })));

  return {
    totalReceita,
    totalDespesa,
    lucroLiquido,
    margemLucro,
    receitaPorMes,
    despesaPorMes,
  };
};

const groupByMonth = (transactions: FinancialTransaction[]): { month: string; value: number }[] => {
  const monthMap = new Map<string, number>();

  transactions.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthMap.get(monthKey) || 0;
    monthMap.set(monthKey, current + Math.abs(t.valor));
  });

  return Array.from(monthMap.entries())
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};

export const groupByCategory = (
  transactions: FinancialTransaction[],
  groupBy: 'grupo' | 'subgrupo' | 'empresa'
): { name: string; value: number }[] => {
  const categoryMap = new Map<string, number>();

  transactions.forEach(t => {
    const key = t[groupBy];
    if (key) {
      const current = categoryMap.get(key) || 0;
      categoryMap.set(key, current + Math.abs(t.valor));
    }
  });

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const compareYears = (
  transactions: FinancialTransaction[]
): { year: string; receitas: number; despesas: number }[] => {
  const yearMap = new Map<string, { receitas: number; despesas: number }>();

  transactions.forEach(t => {
    const year = t.date.getFullYear().toString();
    const current = yearMap.get(year) || { receitas: 0, despesas: 0 };
    
    if (t.tipo === 'c') {
      current.receitas += t.valor;
    } else {
      current.despesas += Math.abs(t.valor);
    }
    
    yearMap.set(year, current);
  });

  return Array.from(yearMap.entries())
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => a.year.localeCompare(b.year));
};

export const getTopExpenses = (
  transactions: FinancialTransaction[],
  limit: number = 10
): { name: string; value: number }[] => {
  const despesas = transactions.filter(t => t.tipo === 'd');
  return groupByCategory(despesas, 'subgrupo').slice(0, limit);
};
