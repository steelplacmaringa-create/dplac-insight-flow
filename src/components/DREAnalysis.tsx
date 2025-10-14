import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FinancialTransaction } from '@/types/financial';
import { formatCurrency } from '@/utils/excelParser';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface DREAnalysisProps {
  transactions: FinancialTransaction[];
}

export const DREAnalysis = ({ transactions }: DREAnalysisProps) => {
  const [revenueType, setRevenueType] = useState<'total' | 'vendas'>('total');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  };

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

  // Calcular DRE Anual com detalhes por grupo e subgrupo
  const calculateAnnualDRE = () => {
    const yearMap = new Map<string, any>();

    transactions.forEach(t => {
      const year = t.date.getFullYear().toString();
      
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          receitaVendas: 0,
          outrasReceitas: 0,
          receitaTotal: 0,
          custosVariaveis: 0,
          custosVariaveisDetalhes: new Map<string, Map<string, number>>(), // grupo -> subgrupo -> valor
          margemContribuicao: 0,
          despesasPessoal: 0,
          despesasPessoalDetalhes: new Map<string, Map<string, number>>(),
          despesasAdministrativas: 0,
          despesasAdministrativasDetalhes: new Map<string, Map<string, number>>(),
          despesasOperacionais: 0,
          despesasOperacionaisDetalhes: new Map<string, Map<string, number>>(),
          despesasFinanceiras: 0,
          despesasFinanceirasDetalhes: new Map<string, Map<string, number>>(),
          outrasDespesas: 0,
          outrasDespesasDetalhes: new Map<string, Map<string, number>>(),
          resultadoOperacional: 0,
        });
      }

      const current = yearMap.get(year);
      
      if (t.tipo === 'c') {
        const grupoLower = t.grupo.toLowerCase();
        if (grupoLower.includes('receita') && grupoLower.includes('venda')) {
          current.receitaVendas += Math.abs(t.valor);
        }
        current.receitaTotal += Math.abs(t.valor);
        current.outrasReceitas = current.receitaTotal - current.receitaVendas;
      } else {
        const grupoLower = t.grupo.toLowerCase();
        const grupoOriginal = t.grupo;
        const subgrupoOriginal = t.subgrupo;
        const valor = Math.abs(t.valor);
        
        const addToCategory = (detalhesMap: Map<string, Map<string, number>>) => {
          if (!detalhesMap.has(grupoOriginal)) {
            detalhesMap.set(grupoOriginal, new Map<string, number>());
          }
          const subgrupoMap = detalhesMap.get(grupoOriginal)!;
          subgrupoMap.set(
            subgrupoOriginal,
            (subgrupoMap.get(subgrupoOriginal) || 0) + valor
          );
        };
        
        if (grupoLower.includes('custo') && grupoLower.includes('variá')) {
          current.custosVariaveis += valor;
          addToCategory(current.custosVariaveisDetalhes);
        } else if (grupoLower.includes('pessoal')) {
          current.despesasPessoal += valor;
          addToCategory(current.despesasPessoalDetalhes);
        } else if (grupoLower.includes('administrat')) {
          current.despesasAdministrativas += valor;
          addToCategory(current.despesasAdministrativasDetalhes);
        } else if (grupoLower.includes('operacion')) {
          current.despesasOperacionais += valor;
          addToCategory(current.despesasOperacionaisDetalhes);
        } else if (grupoLower.includes('financeira')) {
          current.despesasFinanceiras += valor;
          addToCategory(current.despesasFinanceirasDetalhes);
        } else {
          current.outrasDespesas += valor;
          addToCategory(current.outrasDespesasDetalhes);
        }
      }
    });

    yearMap.forEach((value) => {
      const receita = revenueType === 'vendas' ? value.receitaVendas : value.receitaTotal;
      value.margemContribuicao = receita - value.custosVariaveis;
      value.resultadoOperacional = value.margemContribuicao - 
        (value.despesasPessoal + value.despesasAdministrativas + 
         value.despesasOperacionais + value.despesasFinanceiras + value.outrasDespesas);
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
          <TooltipProvider>
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
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-2 font-semibold">Receita de Vendas</td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2">{formatCurrency(row.receitaVendas)}</td>
                    ))}
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-2">Outras Entradas</td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2">{formatCurrency(row.outrasReceitas)}</td>
                    ))}
                  </tr>
                  
                  {/* Custos Variáveis */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('custosVariaveis')}>
                    <td className="p-2 pl-4 text-muted-foreground flex items-center gap-2">
                      {expandedSections.custosVariaveis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      (-) Custos Variáveis
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.custosVariaveis)}</td>
                    ))}
                  </tr>
                  {expandedSections.custosVariaveis && annualDRE[0]?.custosVariaveisDetalhes.size > 0 && (
                    Array.from(annualDRE[0].custosVariaveisDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `custosVariaveis_${grupo}`;
                      
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.custosVariaveisDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.custosVariaveisDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].custosVariaveisDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.custosVariaveisDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  <tr className="border-b hover:bg-muted/50 font-semibold">
                    <td className="p-2 flex items-center gap-2">
                      = Margem de Contribuição
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>A Margem de Contribuição representa o valor disponível após subtrair os custos variáveis da receita. É utilizada para cobrir custos fixos e gerar lucro.</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2">{formatCurrency(row.margemContribuicao)}</td>
                    ))}
                  </tr>
                  
                  {/* Despesas com Pessoal */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('despesasPessoal')}>
                    <td className="p-2 flex items-center gap-2">
                      {expandedSections.despesasPessoal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Despesas com Pessoal
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.despesasPessoal)}</td>
                    ))}
                  </tr>
                  {expandedSections.despesasPessoal && annualDRE[0]?.despesasPessoalDetalhes.size > 0 && (
                    Array.from(annualDRE[0].despesasPessoalDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `despesasPessoal_${grupo}`;
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.despesasPessoalDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.despesasPessoalDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].despesasPessoalDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.despesasPessoalDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  {/* Despesas Administrativas */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('despesasAdministrativas')}>
                    <td className="p-2 flex items-center gap-2">
                      {expandedSections.despesasAdministrativas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Despesas Administrativas
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.despesasAdministrativas)}</td>
                    ))}
                  </tr>
                  {expandedSections.despesasAdministrativas && annualDRE[0]?.despesasAdministrativasDetalhes.size > 0 && (
                    Array.from(annualDRE[0].despesasAdministrativasDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `despesasAdministrativas_${grupo}`;
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.despesasAdministrativasDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.despesasAdministrativasDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].despesasAdministrativasDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.despesasAdministrativasDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  {/* Despesas Operacionais */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('despesasOperacionais')}>
                    <td className="p-2 flex items-center gap-2">
                      {expandedSections.despesasOperacionais ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Despesas Operacionais
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.despesasOperacionais)}</td>
                    ))}
                  </tr>
                  {expandedSections.despesasOperacionais && annualDRE[0]?.despesasOperacionaisDetalhes.size > 0 && (
                    Array.from(annualDRE[0].despesasOperacionaisDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `despesasOperacionais_${grupo}`;
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.despesasOperacionaisDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.despesasOperacionaisDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].despesasOperacionaisDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.despesasOperacionaisDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  {/* Despesas Financeiras */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('despesasFinanceiras')}>
                    <td className="p-2 flex items-center gap-2">
                      {expandedSections.despesasFinanceiras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Despesas Financeiras
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.despesasFinanceiras)}</td>
                    ))}
                  </tr>
                  {expandedSections.despesasFinanceiras && annualDRE[0]?.despesasFinanceirasDetalhes.size > 0 && (
                    Array.from(annualDRE[0].despesasFinanceirasDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `despesasFinanceiras_${grupo}`;
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.despesasFinanceirasDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.despesasFinanceirasDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].despesasFinanceirasDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.despesasFinanceirasDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  {/* Outras Despesas */}
                  <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleSection('outrasDespesas')}>
                    <td className="p-2 flex items-center gap-2">
                      {expandedSections.outrasDespesas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Outras Despesas
                    </td>
                    {annualDRE.map(row => (
                      <td key={row.year} className="text-right p-2 text-destructive">{formatCurrency(row.outrasDespesas)}</td>
                    ))}
                  </tr>
                  {expandedSections.outrasDespesas && annualDRE[0]?.outrasDespesasDetalhes.size > 0 && (
                    Array.from(annualDRE[0].outrasDespesasDetalhes.keys()).map((grupo: string) => {
                      const grupoKey = `outrasDespesas_${grupo}`;
                      return (
                        <>
                          <tr key={grupo} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleGroup(grupoKey)}>
                            <td className="p-2 pl-8 text-sm flex items-center gap-2">
                              {expandedGroups[grupoKey] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {grupo}
                            </td>
                            {annualDRE.map(row => {
                              const subgrupoMap = row.outrasDespesasDetalhes.get(grupo);
                              const total = (subgrupoMap ? Array.from(subgrupoMap.values()).reduce((s: number, v: number) => s + v, 0) : 0) as number;
                              return (
                                <td key={row.year} className="text-right p-2 text-sm text-destructive">
                                  {formatCurrency(total)}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedGroups[grupoKey] && annualDRE[0]?.outrasDespesasDetalhes.get(grupo) && (
                            Array.from(annualDRE[0].outrasDespesasDetalhes.get(grupo)!.keys()).map((subgrupo: string) => (
                              <tr key={`${grupo}_${subgrupo}`} className="hover:bg-muted/20">
                                <td className="p-2 pl-12 text-xs text-muted-foreground">{subgrupo}</td>
                                {annualDRE.map(row => {
                                  const subgrupoMap = row.outrasDespesasDetalhes.get(grupo);
                                  const valor = (subgrupoMap?.get(subgrupo) as number) || 0;
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
                    })
                  )}
                  
                  <tr className="border-t-2 font-bold">
                    <td className="p-2">= Resultado Operacional</td>
                    {annualDRE.map(row => (
                      <td key={row.year} className={`text-right p-2 ${row.resultadoOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(row.resultadoOperacional)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        </TabsContent>
      </Tabs>
    </Card>
  );
};