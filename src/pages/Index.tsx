import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ThemeToggle } from '@/components/ThemeToggle';
import { KPICard } from '@/components/KPICard';
import { FilterPanel } from '@/components/FilterPanel';
import { RevenueExpenseChart } from '@/components/charts/RevenueExpenseChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { YearComparisonChart } from '@/components/charts/YearComparisonChart';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { TopExpensesChart } from '@/components/charts/TopExpensesChart';
import { AIInsights } from '@/components/AIInsights';
import { parseExcelFile } from '@/utils/excelParser';
import { filterTransactions, calculateKPIs, groupByCategory, compareYears, getTopExpenses } from '@/utils/dataProcessing';
import { ProcessedData, FilterState } from '@/types/financial';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    empresas: [],
    grupos: [],
    subgrupos: [],
    tipo: null,
    startDate: null,
    endDate: null,
  });

  const handleFileSelect = async (file: File) => {
    try {
      const parsedData = await parseExcelFile(file);
      setData(parsedData);
      toast.success(`${parsedData.transactions.length} transações carregadas!`);
    } catch (error) {
      toast.error('Erro ao processar arquivo');
      console.error(error);
    }
  };

  const filteredTransactions = data ? filterTransactions(data.transactions, filters) : [];
  const kpiData = calculateKPIs(filteredTransactions);
  const groupedByGrupo = groupByCategory(filteredTransactions, 'grupo');
  const yearComparison = data ? compareYears(filteredTransactions) : [];
  const topExpenses = getTopExpenses(filteredTransactions);

  const monthlyData = kpiData.receitaPorMes.map(r => {
    const despesa = kpiData.despesaPorMes.find(d => d.month === r.month);
    return {
      month: r.month,
      receitas: r.value,
      despesas: despesa?.value || 0,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">DPLAC Análise Financeira</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!data ? (
          <div className="max-w-2xl mx-auto mt-20">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Dashboard Financeiro</h2>
                <p className="text-muted-foreground">
                  {filteredTransactions.length} transações · {data.dateRange.start.toLocaleDateString('pt-BR')} até {data.dateRange.end.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <FilterPanel data={data} filters={filters} onFilterChange={setFilters} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard title="Receita Total" value={kpiData.totalReceita} icon={TrendingUp} colorClass="text-success" />
              <KPICard title="Despesa Total" value={kpiData.totalDespesa} icon={TrendingDown} colorClass="text-destructive" />
              <KPICard title="Lucro Líquido" value={kpiData.lucroLiquido} icon={DollarSign} colorClass="text-primary" />
              <KPICard title="Margem de Lucro" value={kpiData.margemLucro} icon={PieChart} format="percent" colorClass="text-info" />
            </div>

            <AIInsights kpiData={kpiData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueExpenseChart data={monthlyData} />
              <CategoryPieChart data={groupedByGrupo} title="Distribuição por Grupo" />
            </div>

            {yearComparison.length > 1 && (
              <YearComparisonChart data={yearComparison} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart kpiData={kpiData} />
              <TopExpensesChart data={topExpenses} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
