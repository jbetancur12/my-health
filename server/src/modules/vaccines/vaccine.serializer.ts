import { Vaccine } from '../../entities/Vaccine.js';
import type { VaccineDto } from '../../../../shared/contracts/http.js';

export function serializeVaccine(vaccine: Vaccine): VaccineDto {
  return {
    id: vaccine.id,
    name: vaccine.name,
    date: vaccine.date.toISOString(),
    nextDose: vaccine.nextDose?.toISOString(),
    doseNumber: vaccine.doseNumber,
    totalDoses: vaccine.totalDoses,
    location: vaccine.location,
    lot: vaccine.lot,
    notes: vaccine.notes,
    createdAt: vaccine.createdAt.toISOString(),
  };
}
