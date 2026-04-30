import { useCallback, useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type {
  ClinicalSuggestion,
  ClinicalSuggestionStatus,
} from '../../../shared/api/contracts';

export function useClinicalSuggestionsData() {
  const [clinicalSuggestions, setClinicalSuggestions] = useState<ClinicalSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const suggestions = await api.getClinicalSuggestions();
      setClinicalSuggestions(suggestions);
      return suggestions;
    } catch (loadError) {
      console.error('Error loading clinical suggestions:', loadError);
      setError('No pudimos cargar las sugerencias clínicas revisables.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateSuggestionStatus = useCallback(
    async (id: string, status: ClinicalSuggestionStatus) => {
      const updated = await api.updateClinicalSuggestionStatus(id, status);
      setClinicalSuggestions((current) =>
        current.map((suggestion) => (suggestion.id === id ? updated : suggestion))
      );
      return updated;
    },
    []
  );

  return {
    clinicalSuggestions,
    error,
    isLoading,
    refreshClinicalSuggestions: loadData,
    updateSuggestionStatus,
  };
}
