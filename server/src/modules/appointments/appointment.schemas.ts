import type { AppointmentDocumentInput, AppointmentInput } from './appointment.types.js';
import {
  parseArray,
  parseDateLike,
  parseNonEmptyString,
  parseObject,
  parseOptionalArray,
  parseOptionalString,
} from '../shared/validation.js';

export function parseAppointmentInput(input: unknown): AppointmentInput {
  const record = parseObject(input, 'Invalid appointment payload');

  return {
    date: parseDateLike(record.date, 'Appointment date is required'),
    specialty: parseNonEmptyString(record.specialty, 'Appointment specialty is required'),
    doctor: parseNonEmptyString(record.doctor, 'Appointment doctor is required'),
    notes: parseOptionalString(record.notes),
    tags: parseOptionalStringArray(record.tags),
    documents: parseAppointmentDocuments(record.documents),
  };
}

export function parseAppointmentUpdateInput(input: unknown): Partial<AppointmentInput> {
  const record = parseObject(input, 'Invalid appointment payload');
  const output: Partial<AppointmentInput> = {};

  if (record.date !== undefined) {
    output.date = parseDateLike(record.date, 'Appointment date must be a valid value');
  }

  if (record.specialty !== undefined) {
    output.specialty = parseNonEmptyString(
      record.specialty,
      'Appointment specialty cannot be empty'
    );
  }

  if (record.doctor !== undefined) {
    output.doctor = parseNonEmptyString(record.doctor, 'Appointment doctor cannot be empty');
  }

  if (record.notes !== undefined) {
    output.notes = parseOptionalString(record.notes);
  }

  if (record.tags !== undefined) {
    output.tags = parseOptionalStringArray(record.tags) ?? [];
  }

  if (record.documents !== undefined) {
    output.documents = parseAppointmentDocuments(record.documents);
  }

  return output;
}

function parseAppointmentDocuments(input: unknown) {
  return parseArray(input, 'Appointment documents must be an array').map((item) =>
    parseAppointmentDocument(item)
  );
}

function parseAppointmentDocument(input: unknown): AppointmentDocumentInput {
  const record = parseObject(input, 'Invalid appointment document');

  return {
    id: parseNonEmptyString(record.id, 'Appointment document id is required'),
    type: parseNonEmptyString(
      record.type,
      'Appointment document type is required'
    ) as AppointmentDocumentInput['type'],
    name: parseNonEmptyString(record.name, 'Appointment document name is required'),
    date: parseDateLike(record.date, 'Appointment document date is required'),
  };
}

function parseOptionalStringArray(input: unknown) {
  const values = parseOptionalArray(input);
  return values?.map((item) => parseNonEmptyString(item, 'Expected non-empty string value'));
}
