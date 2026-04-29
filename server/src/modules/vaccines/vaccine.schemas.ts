import type { VaccineInput } from './vaccine.types.js';
import {
  parseDateLike,
  parseNonEmptyString,
  parseObject,
  parseOptionalDateLike,
  parseOptionalNumber,
  parseOptionalString,
} from '../shared/validation.js';

export function parseVaccineInput(input: unknown): VaccineInput {
  const record = parseObject(input, 'Invalid vaccine payload');

  return {
    name: parseNonEmptyString(record.name, 'Vaccine name is required'),
    date: parseDateLike(record.date, 'Vaccine date is required'),
    nextDose: parseOptionalDateLike(record.nextDose),
    doseNumber: parseOptionalNumber(record.doseNumber),
    totalDoses: parseOptionalNumber(record.totalDoses),
    location: parseOptionalString(record.location),
    lot: parseOptionalString(record.lot),
    notes: parseOptionalString(record.notes),
  };
}
