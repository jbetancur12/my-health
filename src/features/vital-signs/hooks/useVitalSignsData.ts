import { useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { VitalSignReading } from '../../../shared/api/contracts';

export function useVitalSignsData() {
  const [vitalSigns, setVitalSigns] = useState<VitalSignReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const vitalSignsData = await api.getVitalSigns();
      setVitalSigns(vitalSignsData);
    } catch (error) {
      console.error('Error loading vital signs:', error);
      setError('No pudimos cargar el historial de signos vitales.');
    } finally {
      setIsLoading(false);
    }
  }

  async function addVitalSign(reading: Omit<VitalSignReading, 'id'>) {
    const savedReading = await api.saveVitalSign(reading);
    setVitalSigns((current) => [savedReading, ...current]);
    return savedReading;
  }

  async function removeVitalSign(id: string) {
    await api.deleteVitalSign(id);
    setVitalSigns((current) => current.filter((reading) => reading.id !== id));
  }

  function replaceVitalSigns(vitalSignsData: VitalSignReading[]) {
    setVitalSigns(vitalSignsData);
  }

  return {
    vitalSigns,
    error,
    isLoading,
    addVitalSign,
    removeVitalSign,
    replaceVitalSigns,
  };
}
