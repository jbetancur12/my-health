import type { VitalSignInput } from './vital-sign.types.js';
import {
  parseDateLike,
  parseObject,
  parseOptionalNumber,
  parseOptionalString,
} from '../shared/validation.js';

export function parseVitalSignInput(input: unknown): VitalSignInput {
  const record = parseObject(input, 'Invalid vital sign payload');

  return {
    date: parseDateLike(record.date, 'Vital sign date is required'),
    bloodPressureSystolic: parseOptionalNumber(record.bloodPressureSystolic),
    bloodPressureDiastolic: parseOptionalNumber(record.bloodPressureDiastolic),
    heartRate: parseOptionalNumber(record.heartRate),
    weight: parseOptionalNumber(record.weight),
    glucose: parseOptionalNumber(record.glucose),
    temperature: parseOptionalNumber(record.temperature),
    oxygenSaturation: parseOptionalNumber(record.oxygenSaturation),
    notes: parseOptionalString(record.notes),
  };
}
