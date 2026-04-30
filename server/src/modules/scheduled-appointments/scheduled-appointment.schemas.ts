import type {
  AppointmentDocumentPayload,
  DocumentType,
  ScheduledAppointmentStatus,
} from '../../../../shared/contracts/http.js';
import {
  parseArray,
  parseDateLike,
  parseNonEmptyString,
  parseObject,
  parseOptionalArray,
  parseOptionalString,
  ValidationError,
} from '../shared/validation.js';
import type {
  ScheduledAppointmentConvertInput,
  ScheduledAppointmentInput,
} from './scheduled-appointment.types.js';

const validScheduledAppointmentStatuses = new Set<ScheduledAppointmentStatus>([
  'scheduled',
  'confirmed',
  'completed',
  'canceled',
  'no_show',
  'converted',
]);

function parseExpectedDocument(input: unknown): AppointmentDocumentPayload {
  const record = parseObject(input, 'Documento esperado inválido');

  return {
    id: parseNonEmptyString(record.id, 'El documento esperado requiere id'),
    type: parseNonEmptyString(record.type, 'El documento esperado requiere tipo') as DocumentType,
    name: parseNonEmptyString(record.name, 'El documento esperado requiere nombre'),
    date: parseDateLike(record.date, 'El documento esperado requiere fecha'),
  };
}

function parseStatus(input: unknown) {
  if (input === undefined) {
    return undefined;
  }

  const status = parseNonEmptyString(input, 'La cita programada requiere un estado válido');
  if (!validScheduledAppointmentStatuses.has(status as ScheduledAppointmentStatus)) {
    throw new ValidationError('El estado de la cita programada no es válido');
  }

  return status as ScheduledAppointmentStatus;
}

export function parseScheduledAppointmentInput(input: unknown): ScheduledAppointmentInput {
  const record = parseObject(input, 'Payload inválido para cita programada');

  return {
    scheduledAt: parseDateLike(record.scheduledAt, 'La cita programada requiere fecha y hora'),
    specialty: parseNonEmptyString(record.specialty, 'La cita programada requiere especialidad'),
    doctor: parseNonEmptyString(record.doctor, 'La cita programada requiere médico'),
    location: parseOptionalString(record.location),
    notes: parseOptionalString(record.notes),
    expectedDocuments:
      parseOptionalArray(record.expectedDocuments)?.map(parseExpectedDocument) ?? [],
    status: parseStatus(record.status),
  };
}

export function parseScheduledAppointmentUpdateInput(input: unknown) {
  const record = parseObject(input, 'Payload inválido para actualizar cita programada');

  return {
    scheduledAt:
      record.scheduledAt === undefined
        ? undefined
        : parseDateLike(record.scheduledAt, 'La cita programada requiere fecha y hora'),
    specialty:
      record.specialty === undefined
        ? undefined
        : parseNonEmptyString(record.specialty, 'La cita programada requiere especialidad'),
    doctor:
      record.doctor === undefined
        ? undefined
        : parseNonEmptyString(record.doctor, 'La cita programada requiere médico'),
    location: record.location === undefined ? undefined : parseOptionalString(record.location),
    notes: record.notes === undefined ? undefined : parseOptionalString(record.notes),
    expectedDocuments:
      record.expectedDocuments === undefined
        ? undefined
        : parseArray(record.expectedDocuments, 'Los documentos esperados deben ser un arreglo').map(
            parseExpectedDocument
          ),
    status: parseStatus(record.status),
  };
}

export function parseScheduledAppointmentConvertInput(
  input: unknown
): ScheduledAppointmentConvertInput {
  const record = parseObject(input, 'Payload inválido para convertir cita programada');

  return {
    appointmentId: parseNonEmptyString(record.appointmentId, 'La conversión requiere appointmentId'),
  };
}
