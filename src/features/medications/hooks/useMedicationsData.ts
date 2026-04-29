import { useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { Medication } from '../../../shared/api/contracts';

export function useMedicationsData() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const medicationsData = await api.getMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
      setError('No pudimos cargar los medicamentos guardados.');
    } finally {
      setIsLoading(false);
    }
  }

  async function addMedication(medication: Omit<Medication, 'id'>) {
    const savedMedication = await api.saveMedication(medication);
    setMedications((current) => [...current, savedMedication]);
    return savedMedication;
  }

  async function removeMedication(id: string) {
    await api.deleteMedication(id);
    setMedications((current) => current.filter((medication) => medication.id !== id));
  }

  async function toggleMedication(id: string) {
    const medication = medications.find((item) => item.id === id);
    if (!medication) {
      return null;
    }

    const updatedMedication = { ...medication, active: !medication.active };
    const savedMedication = await api.updateMedication(id, updatedMedication);
    setMedications((current) => current.map((item) => (item.id === id ? savedMedication : item)));
    return savedMedication;
  }

  function replaceMedications(medicationsData: Medication[]) {
    setMedications(medicationsData);
  }

  return {
    medications,
    error,
    isLoading,
    addMedication,
    removeMedication,
    toggleMedication,
    replaceMedications,
  };
}
