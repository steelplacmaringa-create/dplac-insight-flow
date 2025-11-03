export interface FinancialTransaction {
  date: Date;
  empresa: string;
  descricao: string;
  tipo: 'c' | 'd'; // c = crédito/receita, d = débito/despesa
  valor: number;
  conta: string;
  grupo: string;
  subgrupo: string;
}

export interface ProcessedData {
  transactions: FinancialTransaction[];
  empresas: string[];
  grupos: string[];
  subgrupos: string[];
  contas: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface FilterState {
  empresas: string[];
  grupos: string[];
  subgrupos: string[];
  contas: string[];
  tipo: ('c' | 'd')[] | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface KPIData {
  totalReceita: number;
  totalDespesa: number;
  lucroLiquido: number;
  margemLucro: number;
  receitaPorMes: { month: string; value: number }[];
  despesaPorMes: { month: string; value: number }[];
}

export interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  priority: number;
}
