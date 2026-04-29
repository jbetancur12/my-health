import { Medication } from '../../entities/Medication.js';
import type { MedicationDto } from '../../../../shared/contracts/http.js';

export function serializeMedication(medication: Medication): MedicationDto {
  return {
    id: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: medication.startDate.toISOString(),
    endDate: medication.endDate?.toISOString(),
    notes: medication.notes,
    active: medication.active,
    createdAt: medication.createdAt.toISOString(),
  };
}
