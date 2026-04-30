import { useCallback, useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { ClinicalMemory } from '../../../shared/api/contracts';

const EMPTY_CLINICAL_MEMORY: ClinicalMemory = {
  activeConditions: [],
  historicalConditions: [],
  activeMedications: [],
  importantFindings: [],
  pendingStudies: [],
  followUpRecommendations: [],
};

export function useClinicalMemoryData() {
  const [clinicalMemory, setClinicalMemory] = useState<ClinicalMemory>(EMPTY_CLINICAL_MEMORY);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const memory = await api.getClinicalMemory();
      setClinicalMemory(memory);
      return memory;
    } catch (loadError) {
      console.error('Error loading clinical memory:', loadError);
      setError('No pudimos cargar la memoria clínica consolidada.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    clinicalMemory,
    error,
    isLoading,
    refreshClinicalMemory: loadData,
  };
}
