import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialTransaction } from '@/types/financial';
import { formatCurrency } from '@/utils/excelParser';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DREAnalysisProps {
  transactions: FinancialTransaction[];
}

export const DREAnalysis = ({ transactions }: DREAnalysisProps) => {
  const [revenueType, setRevenueType] = useState<'total' | 'vendas'>('total');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  };

  // Calcular DRE Mensal
  const calculateMonthlyDRE = () => {
    const monthMap = new Map<string, any>();

    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          receitaVendas: 0,
          outrasReceitas: 0,
          receitaTotal: 0,
          despesas: 0,
          lucro: 0,
        });
      }

      const current = monthMap.get(monthKey);
      
      if (t.tipo === 'c') {
        const grupoLower = t.grupo.toLowerCase();
        // Receita de vendas: deve estar no grupo que contém "receita" E "venda"
        if (grupoLower.includes('receita') && grupoLower.includes('venda')) {
          current.receitaVendas += Math.abs(t.valor);
        }
        // Todas as receitas (tipo 'c') vão para receita total
        current.receitaTotal += Math.abs(t.valor);
        // Outras receitas são: receita total - receita de vendas
        current.outrasReceitas = current.receitaTotal - current.receitaVendas;
      } else {
        current.despesas += Math.abs(t.valor);
      }
    });

    // Calcular lucro baseado no tipo de receita selecionado
    monthMap.forEach((value) => {
      const receita = revenueType === 'vendas' ? value.receitaVendas : value.receitaTotal;
      value.lucro = receita - value.despesas;
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  // Calcular DRE Anual baseado em GRUPO > SUBGRUPO
  const calculateAnnualDRE = () => {
    const yearMap = new Map<string, any>();

    transactions.forEach(t => {
      const year = t.date.getFullYear().toString();
      
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          receitas: new Map<string, Map<string, number>>(), // grupo -> subgrupo -> valor
          despesas: new Map<string, Map<string, number>>(), // grupo -> subgrupo -> valor
          totalReceitas: 0,
          totalReceitasVendas: 0,
          totalDespesas: 0,
          totalDespesasOperacionais: 0,
          lucro: 0,
        });
      }

      const current = yearMap.get(year);
      const valor = Math.abs(t.valor);
      const grupoLower = t.grupo.toLowerCase();
      
      if (t.tipo === 'c') {
        // Receitas
        current.totalReceitas += valor;
        
        // Verificar se é receita de vendas
        if (grupoLower.includes('receita') && grupoLower.includes('venda')) {
          current.totalReceitasVendas += valor;
        }
        
        if (!current.receitas.has(t.grupo)) {
          current.receitas.set(t.grupo, new Map<string, number>());
        }
        const subgrupoMap = current.receitas.get(t.grupo)!;
        subgrupoMap.set(t.subgrupo, (subgrupoMap.get(t.subgrupo) || 0) + valor);
      } else {
        // Despesas
        const isSaidaNaoOperacional = grupoLower.includes('saida') && grupoLower.includes('não operacional');
        
        current.totalDespesas += valor;
        
        // Total de despesas operacionais (excluindo saída não operacional)
        if (!isSaidaNaoOperacional) {
          current.totalDespesasOperacionais += valor;
        }
        
        if (!current.despesas.has(t.grupo)) {
          current.despesas.set(t.grupo, new Map<string, number>());
        }
        const subgrupoMap = current.despesas.get(t.grupo)!;
        subgrupoMap.set(t.subgrupo, (subgrupoMap.get(t.subgrupo) || 0) + valor);
      }
    });

    yearMap.forEach((value) => {
      // Calcular lucro baseado no tipo de receita selecionado
      const receita = revenueType === 'vendas' ? value.totalReceitasVendas : value.totalReceitas;
      const despesa = revenueType === 'vendas' ? value.totalDespesasOperacionais : value.totalDespesas;
      value.lucro = receita - despesa;
    });

    return Array.from(yearMap.entries())
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => a.year.localeCompare(b.year));
  };

  const monthlyDRE = calculateMonthlyDRE();
  const annualDRE = calculateAnnualDRE();

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Análise DRE</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={revenueType === 'total' ? 'default' : 'outline'}
            onClick={() => setRevenueType('total')}
          >
            Receitas Totais
          </Button>
          <Button
            size="sm"
            variant={revenueType === 'vendas' ? 'default' : 'outline'}
            onClick={() => setRevenueType('vendas')}
          >
            Receitas de Vendas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mensal">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mensal">DRE Mensal</TabsTrigger>
          <TabsTrigger value="anual">DRE Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">
                    {revenueType === 'vendas' ? 'Receita de Vendas' : 'Receita Total'}
                  </th>
                  <th className="text-right p-2">Outras Entradas</th>
                  <th className="text-right p-2">Despesas</th>
                  <th className="text-right p-2">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {monthlyDRE.map((row) => (
                  <tr key={row.month} className="border-b hover:bg-muted/50">
                    <td className="p-2">{formatMonth(row.month)}</td>
                    <td className="text-right p-2">{formatCurrency(revenueType === 'vendas' ? row.receitaVendas : row.receitaTotal)}</td>
                    <td className="text-right p-2">{formatCurrency(row.outrasReceitas)}</td>
                    <td className="text-right p-2 text-destructive">{formatCurrency(row.despesas)}</td>
                    <td className={`text-right p-2 font-semibold ${row.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(row.lucro)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2">
                  <td className="p-2">Total</td>
                  <td className="text-right p-2">
                    {formatCurrency(monthlyDRE.reduce((sum, r) => sum + (revenueType === 'vendas' ? r.receitaVendas : r.receitaTotal), 0))}
                  </td>
                  <td className="text-right p-2">
                    {formatCurrency(monthlyDRE.reduce((sum, r) => sum + r.outrasReceitas, 0))}
                  </td>
                  <td className="text-right p-2 text-destructive">
                    {formatCurrency(monthlyDRE.reduce((sum, r) => sum + r.despesas, 0))}
                  </td>
                  <td className="text-right p-2">
                    {formatCurrency(monthlyDRE.reduce((sum, r) => sum + r.lucro, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="anual">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categoria</th>
                  {annualDRE.map(row => (
                    <th key={row.year} className="text-right p-2">{row.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* RECEITAS */}
                <tr className="border-b bg-muted/50">
                  <td className="p-2 font-bold text-success">RECEITAS</td>
                  {annualDRE.map(row => (
                    <td key={row.year} className="text-right p-2 font-bold text-success">
                      {formatCurrency(revenueType === 'vendas' ? row.totalReceitasVendas : row.totalReceitas)}
                    </td>
                  ))}
                </tr>

                {annualDRE[0]?.receitas && Array.from(annualDRE[0].receitas.keys()).map((grupo: string) => {
                  const grupoKey = `receitas_${grupo}`;
                  const grupoLower = grupo.toLowerCase();
                  
                  // Se "Receitas de Vendas" estiver selecionado, mostrar apenas grupos de receita de vendas
                  if (revenueType === 'vendas' && !(grupoLower.includes('receita') && grupoLower.includes('venda'))) {
                    return null;
                  }
                  
                  return (
                    <>
                      <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                        <td className="p-2 pl-6 text-sm flex items-center gap-2">
                          {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {grupo}
                        </td>
                        {annualDRE.map(row => {
                          const subgrupoMap = row.receitas.get(grupo);
                          const total = subgrupoMap 
                            ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) 
                            : 0;
                          return (
                            <td key={row.year} className="text-right p-2 text-sm text-success">
                              {formatCurrency(total as number)}
                            </td>
                          );
                        })}
                      </tr>
                      {expandedGroups[grupoKey] && annualDRE[0]?.receitas.get(grupo) && (
                        Array.from(annualDRE[0].receitas.get(grupo)!.keys()).map((subgrupo: string) => (
                          <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                            <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.receitas.get(grupo);
                              const valor = (subgrupoMap?.get(subgrupo) || 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-xs text-success">
                                  {formatCurrency(valor)}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </>
                  );
                })}

                {/* DESPESAS */}
                <tr className="border-b border-t-2 bg-muted/50 mt-4">
                  <td className="p-2 font-bold text-destructive">DESPESAS</td>
                  {annualDRE.map(row => (
                    <td key={row.year} className="text-right p-2 font-bold text-destructive">
                      {formatCurrency(revenueType === 'vendas' ? row.totalDespesasOperacionais : row.totalDespesas)}
                    </td>
                  ))}
                </tr>

                {annualDRE[0]?.despesas && Array.from(annualDRE[0].despesas.keys()).map((grupo: string) => {
                  const grupoKey = `despesas_${grupo}`;
                  const grupoLower = grupo.toLowerCase();
                  
                  // Se "Receitas de Vendas" estiver selecionado, desconsiderar "SAIDA NÃO OPERACIONAL"
                  if (revenueType === 'vendas' && grupoLower.includes('saida') && grupoLower.includes('não operacional')) {
                    return null;
                  }
                  
                  return (
                    <>
                      <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                        <td className="p-2 pl-6 text-sm flex items-center gap-2">
                          {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {grupo}
                        </td>
                        {annualDRE.map(row => {
                          const subgrupoMap = row.despesas.get(grupo);
                          const total = subgrupoMap 
                            ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) 
                            : 0;
                          return (
                            <td key={row.year} className="text-right p-2 text-sm text-destructive">
                              {formatCurrency(total as number)}
                            </td>
                          );
                        })}
                      </tr>
                      {expandedGroups[grupoKey] && annualDRE[0]?.despesas.get(grupo) && (
                        Array.from(annualDRE[0].despesas.get(grupo)!.keys()).map((subgrupo: string) => (
                          <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                            <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.despesas.get(grupo);
                              const valor = (subgrupoMap?.get(subgrupo) || 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-xs text-destructive">
                                  {formatCurrency(valor)}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </>
                  );
                })}

                {/* LUCRO */}
                <tr className="border-t-2 border-b-2 font-bold bg-muted/50">
                  <td className="p-2">= LUCRO LÍQUIDO</td>
                  {annualDRE.map(row => (
                    <td key={row.year} className={`text-right p-2 ${row.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(row.lucro)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
