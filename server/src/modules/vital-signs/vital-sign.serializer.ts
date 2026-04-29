import { VitalSign } from '../../entities/VitalSign.js';
import type { VitalSignDto } from '../../../../shared/contracts/http.js';

export function serializeVitalSign(vitalSign: VitalSign): VitalSignDto {
  return {
    id: vitalSign.id,
    date: vitalSign.date.toISOString(),
    bloodPressureSystolic: vitalSign.bloodPressureSystolic,
    bloodPressureDiastolic: vitalSign.bloodPressureDiastolic,
    heartRate: vitalSign.heartRate,
    weight: vitalSign.weight,
    glucose: vitalSign.glucose,
    temperature: vitalSign.temperature,
    oxygenSaturation: vitalSign.oxygenSaturation,
    notes: vitalSign.notes,
    createdAt: vitalSign.createdAt.toISOString(),
  };
}
