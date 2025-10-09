import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { FilterState, ProcessedData } from '@/types/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterPanelProps {
  data: ProcessedData;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterPanel = ({ data, filters, onFilterChange }: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmpresaToggle = (empresa: string) => {
    const newEmpresas = filters.empresas.includes(empresa)
      ? filters.empresas.filter(e => e !== empresa)
      : [...filters.empresas, empresa];
    onFilterChange({ ...filters, empresas: newEmpresas });
  };

  const handleGrupoToggle = (grupo: string) => {
    const newGrupos = filters.grupos.includes(grupo)
      ? filters.grupos.filter(g => g !== grupo)
      : [...filters.grupos, grupo];
    onFilterChange({ ...filters, grupos: newGrupos });
  };

  const handleSubgrupoToggle = (subgrupo: string) => {
    const newSubgrupos = filters.subgrupos.includes(subgrupo)
      ? filters.subgrupos.filter(s => s !== subgrupo)
      : [...filters.subgrupos, subgrupo];
    onFilterChange({ ...filters, subgrupos: newSubgrupos });
  };

  const handleTipoToggle = (tipo: 'c' | 'd') => {
    const currentTipo = filters.tipo || [];
    const newTipo = currentTipo.includes(tipo)
      ? currentTipo.filter(t => t !== tipo)
      : [...currentTipo, tipo];
    onFilterChange({ ...filters, tipo: newTipo.length > 0 ? newTipo as ('c' | 'd')[] : null });
  };

  const handleReset = () => {
    onFilterChange({
      empresas: [],
      grupos: [],
      subgrupos: [],
      tipo: null,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = 
    filters.empresas.length > 0 ||
    filters.grupos.length > 0 ||
    filters.subgrupos.length > 0 ||
    (filters.tipo && filters.tipo.length > 0) ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="relative">
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-primary-foreground text-primary text-xs rounded-full">
            {[
              filters.empresas.length,
              filters.grupos.length,
              filters.subgrupos.length,
              filters.tipo?.length || 0,
            ].reduce((a, b) => a + b, 0)}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 p-6 z-50 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtros</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Limpar
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Tipo */}
            <div>
              <Label className="mb-3 block">Tipo de Transação</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-receita"
                    checked={filters.tipo?.includes('c')}
                    onCheckedChange={() => handleTipoToggle('c')}
                  />
                  <label htmlFor="tipo-receita" className="text-sm cursor-pointer">
                    Receitas
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-despesa"
                    checked={filters.tipo?.includes('d')}
                    onCheckedChange={() => handleTipoToggle('d')}
                  />
                  <label htmlFor="tipo-despesa" className="text-sm cursor-pointer">
                    Despesas
                  </label>
                </div>
              </div>
            </div>

            {/* Data */}
            <div>
              <Label className="mb-3 block">Período</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {filters.startDate ? format(filters.startDate, 'P', { locale: ptBR }) : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate || undefined}
                      onSelect={(date) => onFilterChange({ ...filters, startDate: date || null })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {filters.endDate ? format(filters.endDate, 'P', { locale: ptBR }) : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate || undefined}
                      onSelect={(date) => onFilterChange({ ...filters, endDate: date || null })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Empresas */}
            {data.empresas.length > 0 && (
              <div>
                <Label className="mb-3 block">Empresas</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.empresas.map(empresa => (
                    <div key={empresa} className="flex items-center gap-2">
                      <Checkbox
                        id={`empresa-${empresa}`}
                        checked={filters.empresas.includes(empresa)}
                        onCheckedChange={() => handleEmpresaToggle(empresa)}
                      />
                      <label htmlFor={`empresa-${empresa}`} className="text-sm cursor-pointer">
                        {empresa}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grupos */}
            {data.grupos.length > 0 && (
              <div>
                <Label className="mb-3 block">Grupos</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.grupos.map(grupo => (
                    <div key={grupo} className="flex items-center gap-2">
                      <Checkbox
                        id={`grupo-${grupo}`}
                        checked={filters.grupos.includes(grupo)}
                        onCheckedChange={() => handleGrupoToggle(grupo)}
                      />
                      <label htmlFor={`grupo-${grupo}`} className="text-sm cursor-pointer">
                        {grupo}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subgrupos */}
            {data.subgrupos.length > 0 && (
              <div>
                <Label className="mb-3 block">Subgrupos</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.subgrupos.map(subgrupo => (
                    <div key={subgrupo} className="flex items-center gap-2">
                      <Checkbox
                        id={`subgrupo-${subgrupo}`}
                        checked={filters.subgrupos.includes(subgrupo)}
                        onCheckedChange={() => handleSubgrupoToggle(subgrupo)}
                      />
                      <label htmlFor={`subgrupo-${subgrupo}`} className="text-sm cursor-pointer">
                        {subgrupo}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
