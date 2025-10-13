import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinancialTransaction } from '@/types/financial';
import { formatCurrency } from '@/utils/excelParser';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MonthlyReportProps {
  transactions: FinancialTransaction[];
}

export const MonthlyReport = ({ transactions }: MonthlyReportProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportType, setReportType] = useState<'sintetico' | 'analitico'>('sintetico');

  const calculateMonthlyData = () => {
    const monthMap = new Map<string, { receitas: number; despesas: number; lucro: number }>();

    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { receitas: 0, despesas: 0, lucro: 0 });
      }

      const current = monthMap.get(monthKey)!;
      
      if (t.tipo === 'c') {
        current.receitas += Math.abs(t.valor);
      } else {
        current.despesas += Math.abs(t.valor);
      }
    });

    // Calcular lucro
    monthMap.forEach((value) => {
      value.lucro = value.receitas - value.despesas;
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const monthlyData = calculateMonthlyData();

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Relatório Mensal ${reportType === 'sintetico' ? 'Sintético' : 'Analítico'} - DPLAC`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    if (reportType === 'sintetico') {
      // Relatório Sintético (resumo mensal)
      const tableData = monthlyData.map(row => [
        formatMonth(row.month),
        formatCurrency(row.receitas),
        formatCurrency(row.despesas),
        formatCurrency(row.lucro),
      ]);

      const totals = monthlyData.reduce(
        (acc, row) => ({
          receitas: acc.receitas + row.receitas,
          despesas: acc.despesas + row.despesas,
          lucro: acc.lucro + row.lucro,
        }),
        { receitas: 0, despesas: 0, lucro: 0 }
      );

      tableData.push([
        'TOTAL',
        formatCurrency(totals.receitas),
        formatCurrency(totals.despesas),
        formatCurrency(totals.lucro),
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Mês', 'Recebimentos de Vendas', 'Despesas', 'Lucro']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
        },
      });
    } else {
      // Relatório Analítico (todas as transações)
      const tableData = transactions
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(t => [
          t.date.toLocaleDateString('pt-BR'),
          t.empresa,
          t.descricao,
          t.grupo,
          t.subgrupo,
          t.tipo === 'c' ? 'Receita' : 'Despesa',
          formatCurrency(Math.abs(t.valor)),
        ]);

      autoTable(doc, {
        startY: 35,
        head: [['Data', 'Empresa', 'Descrição', 'Grupo', 'Subgrupo', 'Tipo', 'Valor']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { halign: 'right', cellWidth: 25 },
        },
      });
    }

    doc.save(`relatorio-mensal-${reportType}-dplac.pdf`);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setIsExpanded(true)}
          className="shadow-lg"
          size="lg"
        >
          <ChevronUp className="w-4 h-4 mr-2" />
          Relatório Mensal
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-[500px]">
      <Card className="p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Relatório Mensal</h3>
          <div className="flex gap-2">
            <Button onClick={() => setReportType('sintetico')} size="sm" variant={reportType === 'sintetico' ? 'default' : 'outline'}>
              Sintético
            </Button>
            <Button onClick={() => setReportType('analitico')} size="sm" variant={reportType === 'analitico' ? 'default' : 'outline'}>
              Analítico
            </Button>
            <Button onClick={exportToPDF} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => setIsExpanded(false)} size="sm" variant="ghost">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b">
                <th className="text-left p-2">Mês</th>
                <th className="text-right p-2">Receitas</th>
                <th className="text-right p-2">Despesas</th>
                <th className="text-right p-2">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row) => (
                <tr key={row.month} className="border-b hover:bg-muted/50">
                  <td className="p-2">{formatMonth(row.month)}</td>
                  <td className="text-right p-2 text-success">{formatCurrency(row.receitas)}</td>
                  <td className="text-right p-2 text-destructive">{formatCurrency(row.despesas)}</td>
                  <td className={`text-right p-2 font-semibold ${row.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(row.lucro)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2">
                <td className="p-2">Total</td>
                <td className="text-right p-2 text-success">
                  {formatCurrency(monthlyData.reduce((sum, r) => sum + r.receitas, 0))}
                </td>
                <td className="text-right p-2 text-destructive">
                  {formatCurrency(monthlyData.reduce((sum, r) => sum + r.despesas, 0))}
                </td>
                <td className="text-right p-2">
                  {formatCurrency(monthlyData.reduce((sum, r) => sum + r.lucro, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};