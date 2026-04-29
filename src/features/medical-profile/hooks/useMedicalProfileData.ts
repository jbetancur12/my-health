import { useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { MedicalProfile } from '../../../shared/api/contracts';

const EMPTY_PROFILE: MedicalProfile = {
  allergies: [],
  chronicConditions: [],
  emergencyContacts: [],
};

export function useMedicalProfileData() {
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile>(EMPTY_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await api.getMedicalProfile();
      setMedicalProfile(profile);
    } catch (error) {
      console.error('Error loading medical profile:', error);
      setError('No pudimos cargar el perfil médico.');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateMedicalProfile(profile: MedicalProfile) {
    const savedProfile = await api.saveMedicalProfile(profile);
    setMedicalProfile(savedProfile);
    return savedProfile;
  }

  function replaceMedicalProfile(profile: MedicalProfile) {
    setMedicalProfile(profile);
  }

  return {
    medicalProfile,
    error,
    isLoading,
    updateMedicalProfile,
    replaceMedicalProfile,
  };
}
