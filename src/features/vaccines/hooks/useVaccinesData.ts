import { useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { Vaccine } from '../../../shared/api/contracts';

export function useVaccinesData() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const vaccinesData = await api.getVaccines();
      setVaccines(vaccinesData);
    } catch (error) {
      console.error('Error loading vaccines:', error);
      setError('No pudimos cargar el historial de vacunas.');
    } finally {
      setIsLoading(false);
    }
  }

  async function addVaccine(vaccine: Omit<Vaccine, 'id'>) {
    const savedVaccine = await api.saveVaccine(vaccine);
    setVaccines((current) => [savedVaccine, ...current]);
    return savedVaccine;
  }

  async function removeVaccine(id: string) {
    await api.deleteVaccine(id);
    setVaccines((current) => current.filter((vaccine) => vaccine.id !== id));
  }

  function replaceVaccines(vaccinesData: Vaccine[]) {
    setVaccines(vaccinesData);
  }

  return {
    vaccines,
    error,
    isLoading,
    addVaccine,
    removeVaccine,
    replaceVaccines,
  };
}
