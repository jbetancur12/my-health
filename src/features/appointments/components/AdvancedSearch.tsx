import { useState } from 'react';
import { Search, Calendar, Tag, X, SlidersHorizontal } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags?: Array<{ id: string; name: string; color: string }>;
}

export interface SearchFilters {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags: string[];
}

export function AdvancedSearch({ onSearch, availableTags = [] }: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch({
      query,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      tags: selectedTags,
    });
  };

  const handleClear = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedTags([]);
    onSearch({ query: '', tags: [] });
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    );
  };

  const hasFilters = query || dateFrom || dateTo || selectedTags.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por especialidad, médico, notas..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!showAdvanced) {
                onSearch({ query: event.target.value, tags: [] });
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showAdvanced
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Avanzada
        </button>

        {hasFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Limpiar filtros"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateFilter label="Fecha desde" value={dateFrom} onChange={setDateFrom} />
            <DateFilter label="Fecha hasta" value={dateTo} onChange={setDateTo} min={dateFrom} />
          </div>

          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Aplicar Filtros
          </button>
        </div>
      )}

      {hasFilters && !showAdvanced && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-gray-600">Filtros activos:</span>
          {query && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Búsqueda: "{query}"</span>
          )}
          {dateFrom && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Desde: {new Date(dateFrom).toLocaleDateString('es')}
            </span>
          )}
          {dateTo && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Hasta: {new Date(dateTo).toLocaleDateString('es')}
            </span>
          )}
          {selectedTags.length > 0 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {selectedTags.length} etiqueta{selectedTags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DateFilter({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {label}
      </label>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
