import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { formatCurrency } from '@/utils/excelParser';
import { useState } from 'react';

interface DREChartsProps {
  monthlyDRE: Array<{
    month: string;
    receitaVendas: number;
    receitaTotal: number;
    outrasReceitas: number;
    despesas: number;
    lucro: number;
  }>;
  annualDRE: Array<{
    year: string;
    totalReceitas: number;
    totalReceitasVendas: number;
    totalDespesas: number;
    totalDespesasOperacionais: number;
    lucro: number;
  }>;
  revenueType: 'total' | 'vendas';
}

type PeriodType = 'bimestre' | 'trimestre' | 'semestre';

interface PeriodData {
  name: string;
  key: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export const DRECharts = ({ monthlyDRE, annualDRE, revenueType }: DREChartsProps) => {
  const [comparisonPeriod1, setComparisonPeriod1] = useState<string>('');
  const [comparisonPeriod2, setComparisonPeriod2] = useState<string>('');
  const [periodType, setPeriodType] = useState<PeriodType>('trimestre');
  const [periodComparison1, setPeriodComparison1] = useState<string>('');
  const [periodComparison2, setPeriodComparison2] = useState<string>('');

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const monthlyChartData = monthlyDRE.map(row => ({
    name: formatMonth(row.month),
    fullMonth: row.month,
    receitas: revenueType === 'vendas' ? row.receitaVendas : row.receitaTotal,
    despesas: row.despesas,
    lucro: row.lucro,
  }));

  const annualChartData = annualDRE.map(row => ({
    name: row.year,
    fullMonth: row.year,
    receitas: revenueType === 'vendas' ? row.totalReceitasVendas : row.totalReceitas,
    despesas: revenueType === 'vendas' ? row.totalDespesasOperacionais : row.totalDespesas,
    lucro: row.lucro,
  }));

  // Generate period-based data (bimester, trimester, semester)
  const generatePeriodData = (type: PeriodType): PeriodData[] => {
    const periodSize = type === 'bimestre' ? 2 : type === 'trimestre' ? 3 : 6;
    const periodNames = type === 'bimestre' 
      ? ['1º Bim', '2º Bim', '3º Bim', '4º Bim', '5º Bim', '6º Bim']
      : type === 'trimestre'
      ? ['1º Trim', '2º Trim', '3º Trim', '4º Trim']
      : ['1º Sem', '2º Sem'];

    const result: PeriodData[] = [];
    const years = [...new Set(monthlyDRE.map(d => d.month.split('-')[0]))].sort();

    years.forEach(year => {
      const yearMonths = monthlyDRE.filter(d => d.month.startsWith(year)).sort((a, b) => a.month.localeCompare(b.month));
      
      for (let i = 0; i < (12 / periodSize); i++) {
        const startMonth = i * periodSize;
        const periodMonths = yearMonths.filter(d => {
          const monthNum = parseInt(d.month.split('-')[1]);
          return monthNum > startMonth && monthNum <= startMonth + periodSize;
        });

        if (periodMonths.length > 0) {
          const receitas = periodMonths.reduce((sum, m) => sum + (revenueType === 'vendas' ? m.receitaVendas : m.receitaTotal), 0);
          const despesas = periodMonths.reduce((sum, m) => sum + m.despesas, 0);
          
          result.push({
            name: `${periodNames[i]} ${year}`,
            key: `${year}-${i + 1}`,
            receitas,
            despesas,
            lucro: receitas + despesas,
          });
        }
      }
    });

    return result;
  };

  const periodData = generatePeriodData(periodType);

  const calculateComparison = (data: typeof monthlyChartData) => {
    if (!comparisonPeriod1 || !comparisonPeriod2) return null;

    const period1 = data.find(d => d.fullMonth === comparisonPeriod1 || d.name === comparisonPeriod1);
    const period2 = data.find(d => d.fullMonth === comparisonPeriod2 || d.name === comparisonPeriod2);

    if (!period1 || !period2) return null;

    const receitasVar = period2.receitas - period1.receitas;
    const receitasVarPct = period1.receitas !== 0 ? (receitasVar / period1.receitas) * 100 : 0;

    const despesasVar = period2.despesas - period1.despesas;
    const despesasVarPct = period1.despesas !== 0 ? (despesasVar / period1.despesas) * 100 : 0;

    const lucroVar = period2.lucro - period1.lucro;
    const lucroVarPct = period1.lucro !== 0 ? (lucroVar / period1.lucro) * 100 : 0;

    return {
      period1: period1.name,
      period2: period2.name,
      receitas: { var: receitasVar, pct: receitasVarPct, p1: period1.receitas, p2: period2.receitas },
      despesas: { var: despesasVar, pct: despesasVarPct, p1: period1.despesas, p2: period2.despesas },
      lucro: { var: lucroVar, pct: lucroVarPct, p1: period1.lucro, p2: period2.lucro },
    };
  };

  const calculatePeriodComparison = () => {
    if (!periodComparison1 || !periodComparison2) return null;

    const period1 = periodData.find(d => d.key === periodComparison1);
    const period2 = periodData.find(d => d.key === periodComparison2);

    if (!period1 || !period2) return null;

    const receitasVar = period2.receitas - period1.receitas;
    const receitasVarPct = period1.receitas !== 0 ? (receitasVar / period1.receitas) * 100 : 0;

    const despesasVar = period2.despesas - period1.despesas;
    const despesasVarPct = period1.despesas !== 0 ? (despesasVar / period1.despesas) * 100 : 0;

    const lucroVar = period2.lucro - period1.lucro;
    const lucroVarPct = period1.lucro !== 0 ? (lucroVar / period1.lucro) * 100 : 0;

    return {
      period1: period1.name,
      period2: period2.name,
      receitas: { var: receitasVar, pct: receitasVarPct, p1: period1.receitas, p2: period2.receitas },
      despesas: { var: despesasVar, pct: despesasVarPct, p1: period1.despesas, p2: period2.despesas },
      lucro: { var: lucroVar, pct: lucroVarPct, p1: period1.lucro, p2: period2.lucro },
    };
  };

  const monthlyComparison = calculateComparison(monthlyChartData);
  const annualComparison = calculateComparison(annualChartData);
  const periodComparison = calculatePeriodComparison();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Gráficos DRE</h3>

      <Tabs defaultValue="mensal">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="mensal">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="anual">Evolução Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-6">
          {/* Gráfico Combinado Mensal */}
          <div>
            <h4 className="text-sm font-medium mb-3">Receitas, Despesas e Lucro - Mensal</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--success))" name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} name="Lucro" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Comparativo Mensal */}
          <div className="mt-8">
            <h4 className="text-sm font-medium mb-3">Comparativo entre Períodos</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={comparisonPeriod1} onValueChange={setComparisonPeriod1}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período 1" />
                </SelectTrigger>
                <SelectContent>
                  {monthlyDRE.map((row) => (
                    <SelectItem key={row.month} value={row.month}>
                      {formatMonth(row.month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={comparisonPeriod2} onValueChange={setComparisonPeriod2}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período 2" />
                </SelectTrigger>
                <SelectContent>
                  {monthlyDRE.map((row) => (
                    <SelectItem key={row.month} value={row.month}>
                      {formatMonth(row.month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {monthlyComparison && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Indicador</th>
                      <th className="text-right p-2">{monthlyComparison.period1}</th>
                      <th className="text-right p-2">{monthlyComparison.period2}</th>
                      <th className="text-right p-2">Variação</th>
                      <th className="text-right p-2">Variação %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Receitas</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.receitas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.receitas.p2)}</td>
                      <td className={`text-right p-2 ${monthlyComparison.receitas.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(monthlyComparison.receitas.var)}
                      </td>
                      <td className={`text-right p-2 ${monthlyComparison.receitas.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {monthlyComparison.receitas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Despesas</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.despesas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.despesas.p2)}</td>
                      <td className={`text-right p-2 ${monthlyComparison.despesas.var <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(monthlyComparison.despesas.var)}
                      </td>
                      <td className={`text-right p-2 ${monthlyComparison.despesas.pct <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {monthlyComparison.despesas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Lucro</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.lucro.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(monthlyComparison.lucro.p2)}</td>
                      <td className={`text-right p-2 font-semibold ${monthlyComparison.lucro.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(monthlyComparison.lucro.var)}
                      </td>
                      <td className={`text-right p-2 font-semibold ${monthlyComparison.lucro.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {monthlyComparison.lucro.pct.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Comparativo por Período (Bimestre/Trimestre/Semestre) */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Comparativo por Período</h4>
            
            {/* Seletor de tipo de período */}
            <div className="mb-4">
              <Select value={periodType} onValueChange={(v) => {
                setPeriodType(v as PeriodType);
                setPeriodComparison1('');
                setPeriodComparison2('');
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bimestre">Bimestre</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={periodComparison1} onValueChange={setPeriodComparison1}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${periodType} 1`} />
                </SelectTrigger>
                <SelectContent>
                  {periodData.map((row) => (
                    <SelectItem key={row.key} value={row.key}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodComparison2} onValueChange={setPeriodComparison2}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${periodType} 2`} />
                </SelectTrigger>
                <SelectContent>
                  {periodData.map((row) => (
                    <SelectItem key={row.key} value={row.key}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {periodComparison && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Indicador</th>
                      <th className="text-right p-2">{periodComparison.period1}</th>
                      <th className="text-right p-2">{periodComparison.period2}</th>
                      <th className="text-right p-2">Variação</th>
                      <th className="text-right p-2">Variação %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Receitas</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.receitas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.receitas.p2)}</td>
                      <td className={`text-right p-2 ${periodComparison.receitas.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(periodComparison.receitas.var)}
                      </td>
                      <td className={`text-right p-2 ${periodComparison.receitas.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {periodComparison.receitas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Despesas</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.despesas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.despesas.p2)}</td>
                      <td className={`text-right p-2 ${periodComparison.despesas.var <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(periodComparison.despesas.var)}
                      </td>
                      <td className={`text-right p-2 ${periodComparison.despesas.pct <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {periodComparison.despesas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Lucro</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.lucro.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(periodComparison.lucro.p2)}</td>
                      <td className={`text-right p-2 font-semibold ${periodComparison.lucro.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(periodComparison.lucro.var)}
                      </td>
                      <td className={`text-right p-2 font-semibold ${periodComparison.lucro.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {periodComparison.lucro.pct.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="anual" className="space-y-6">
          {/* Gráfico Combinado Anual */}
          <div>
            <h4 className="text-sm font-medium mb-3">Receitas, Despesas e Lucro - Anual</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={annualChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--success))" name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} name="Lucro" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Comparativo Anual */}
          <div className="mt-8">
            <h4 className="text-sm font-medium mb-3">Comparativo entre Períodos</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={comparisonPeriod1} onValueChange={setComparisonPeriod1}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano 1" />
                </SelectTrigger>
                <SelectContent>
                  {annualDRE.map((row) => (
                    <SelectItem key={row.year} value={row.year}>
                      {row.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={comparisonPeriod2} onValueChange={setComparisonPeriod2}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano 2" />
                </SelectTrigger>
                <SelectContent>
                  {annualDRE.map((row) => (
                    <SelectItem key={row.year} value={row.year}>
                      {row.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {annualComparison && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Indicador</th>
                      <th className="text-right p-2">{annualComparison.period1}</th>
                      <th className="text-right p-2">{annualComparison.period2}</th>
                      <th className="text-right p-2">Variação</th>
                      <th className="text-right p-2">Variação %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Receitas</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.receitas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.receitas.p2)}</td>
                      <td className={`text-right p-2 ${annualComparison.receitas.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(annualComparison.receitas.var)}
                      </td>
                      <td className={`text-right p-2 ${annualComparison.receitas.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {annualComparison.receitas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Despesas</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.despesas.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.despesas.p2)}</td>
                      <td className={`text-right p-2 ${annualComparison.despesas.var <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(annualComparison.despesas.var)}
                      </td>
                      <td className={`text-right p-2 ${annualComparison.despesas.pct <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {annualComparison.despesas.pct.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Lucro</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.lucro.p1)}</td>
                      <td className="text-right p-2">{formatCurrency(annualComparison.lucro.p2)}</td>
                      <td className={`text-right p-2 font-semibold ${annualComparison.lucro.var >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(annualComparison.lucro.var)}
                      </td>
                      <td className={`text-right p-2 font-semibold ${annualComparison.lucro.pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {annualComparison.lucro.pct.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
