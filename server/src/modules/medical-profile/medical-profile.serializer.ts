import { MedicalProfile } from '../../entities/MedicalProfile.js';
import type { MedicalProfileDto } from '../../../../shared/contracts/http.js';

export function serializeMedicalProfile(profile: MedicalProfile | null): MedicalProfileDto {
  if (!profile) {
    return {
      bloodType: undefined,
      allergies: [],
      chronicConditions: [],
      emergencyContacts: [],
      insurance: undefined,
      notes: undefined,
    };
  }

  return {
    id: profile.id,
    bloodType: profile.bloodType,
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    emergencyContacts: profile.emergencyContacts,
    insurance: profile.insurance,
    notes: profile.notes,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
