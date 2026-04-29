import type { EmergencyContactInput, MedicalProfileInput } from './medical-profile.types.js';
import {
  parseNonEmptyString,
  parseObject,
  parseOptionalString,
  parseOptionalArray,
} from '../shared/validation.js';

export function parseMedicalProfileInput(input: unknown): MedicalProfileInput {
  const record = parseObject(input, 'Invalid medical profile payload');

  return {
    bloodType: parseOptionalString(record.bloodType),
    allergies: parseOptionalStringArray(record.allergies),
    chronicConditions: parseOptionalStringArray(record.chronicConditions),
    emergencyContacts: parseEmergencyContacts(record.emergencyContacts),
    insurance: parseInsurance(record.insurance),
    notes: parseOptionalString(record.notes),
  };
}

function parseEmergencyContacts(input: unknown) {
  return parseOptionalArray(input)?.map((item) => parseEmergencyContact(item));
}

function parseEmergencyContact(input: unknown): EmergencyContactInput {
  const record = parseObject(input, 'Invalid emergency contact payload');

  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    name: parseNonEmptyString(record.name, 'Emergency contact name is required'),
    relationship: parseNonEmptyString(
      record.relationship,
      'Emergency contact relationship is required'
    ),
    phone: parseNonEmptyString(record.phone, 'Emergency contact phone is required'),
  };
}

function parseInsurance(input: unknown) {
  if (input === undefined || input === null) {
    return undefined;
  }

  const record = parseObject(input, 'Invalid insurance payload');

  return {
    provider: parseNonEmptyString(record.provider, 'Insurance provider is required'),
    policyNumber: parseNonEmptyString(record.policyNumber, 'Insurance policy number is required'),
    groupNumber: parseOptionalString(record.groupNumber),
  };
}

function parseOptionalStringArray(input: unknown) {
  const values = parseOptionalArray(input);
  return values?.map((item) => parseNonEmptyString(item, 'Expected non-empty string value'));
}
