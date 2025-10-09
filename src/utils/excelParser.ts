import * as XLSX from 'xlsx';
import { FinancialTransaction, ProcessedData } from '@/types/financial';

export const parseExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        // Process transactions
        const transactions: FinancialTransaction[] = jsonData.map((row: any) => {
          // Parse date
          let parsedDate: Date;
          const dateValue = row['Data'] || row['data'];
          
          if (typeof dateValue === 'string') {
            // Try parsing different date formats
            const parts = dateValue.split('/');
            if (parts.length === 3) {
              // Assuming M/D/YY or M/D/YYYY format
              const month = parseInt(parts[0]);
              const day = parseInt(parts[1]);
              const year = parts[2].length === 2 
                ? 2000 + parseInt(parts[2]) 
                : parseInt(parts[2]);
              parsedDate = new Date(year, month - 1, day);
            } else {
              parsedDate = new Date(dateValue);
            }
          } else {
            parsedDate = new Date(dateValue);
          }

          // Parse value - handle both string and number formats
          let valor = 0;
          const valorStr = String(row['VALOR'] || row['valor'] || '0');
          
          // Remove currency symbols and convert comma to dot
          const cleanValue = valorStr
            .replace(/[R$\s]/g, '')
            .replace(',', '.');
          
          valor = parseFloat(cleanValue) || 0;

          // Determine transaction type and adjust value
          const tipo = (row['Tipo'] || row['tipo'] || 'c').toLowerCase() as 'c' | 'd';
          
          // If it's a debit and value is positive, make it negative
          if (tipo === 'd' && valor > 0) {
            valor = -valor;
          }
          // If it's a credit and value is negative, make it positive
          if (tipo === 'c' && valor < 0) {
            valor = -valor;
          }

          return {
            date: parsedDate,
            empresa: row['Empresa'] || row['empresa'] || '',
            descricao: row['Descrição'] || row['descricao'] || row['Descricao'] || '',
            tipo,
            valor,
            conta: row['Conta'] || row['conta'] || '',
            grupo: row['Plano Conta - Grupo'] || row['grupo'] || '',
            subgrupo: row['Plano Conta - Sub-grupo'] || row['subgrupo'] || row['Sub-grupo'] || '',
          };
        }).filter(t => t.date && !isNaN(t.date.getTime())); // Filter invalid dates

        // Extract unique values
        const empresas = [...new Set(transactions.map(t => t.empresa))].filter(Boolean);
        const grupos = [...new Set(transactions.map(t => t.grupo))].filter(Boolean);
        const subgrupos = [...new Set(transactions.map(t => t.subgrupo))].filter(Boolean);
        const contas = [...new Set(transactions.map(t => t.conta))].filter(Boolean);

        // Get date range
        const dates = transactions.map(t => t.date.getTime()).filter(d => !isNaN(d));
        const dateRange = {
          start: new Date(Math.min(...dates)),
          end: new Date(Math.max(...dates)),
        };

        resolve({
          transactions,
          empresas,
          grupos,
          subgrupos,
          contas,
          dateRange,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};
