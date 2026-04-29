import type { MedicationInput } from './medication.types.js';
import {
  parseBoolean,
  parseDateLike,
  parseNonEmptyString,
  parseObject,
  parseOptionalBoolean,
  parseOptionalDateLike,
  parseOptionalString,
} from '../shared/validation.js';

export function parseMedicationInput(input: unknown): MedicationInput {
  const record = parseObject(input, 'Invalid medication payload');

  return {
    name: parseNonEmptyString(record.name, 'Medication name is required'),
    dosage: parseNonEmptyString(record.dosage, 'Medication dosage is required'),
    frequency: parseNonEmptyString(record.frequency, 'Medication frequency is required'),
    startDate: parseDateLike(record.startDate, 'Medication start date is required'),
    endDate: parseOptionalDateLike(record.endDate),
    notes: parseOptionalString(record.notes),
    active: parseBoolean(record.active, 'Medication active flag is required'),
  };
}

export function parseMedicationUpdateInput(input: unknown): Partial<MedicationInput> {
  const record = parseObject(input, 'Invalid medication payload');
  const output: Partial<MedicationInput> = {};

  if (record.name !== undefined) {
    output.name = parseNonEmptyString(record.name, 'Medication name cannot be empty');
  }

  if (record.dosage !== undefined) {
    output.dosage = parseNonEmptyString(record.dosage, 'Medication dosage cannot be empty');
  }

  if (record.frequency !== undefined) {
    output.frequency = parseNonEmptyString(
      record.frequency,
      'Medication frequency cannot be empty'
    );
  }

  if (record.startDate !== undefined) {
    output.startDate = parseDateLike(record.startDate, 'Medication start date must be valid');
  }

  if (record.endDate !== undefined) {
    output.endDate = parseOptionalDateLike(record.endDate);
  }

  if (record.notes !== undefined) {
    output.notes = parseOptionalString(record.notes);
  }

  if (record.active !== undefined) {
    output.active = parseOptionalBoolean(record.active);
  }

  return output;
}
