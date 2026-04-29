import type { ControlInput } from './control.types.js';
import { parseDateLike, parseNonEmptyString, parseObject } from '../shared/validation.js';

export function parseControlInput(input: unknown): ControlInput {
  const record = parseObject(input, 'Invalid control payload');

  return {
    date: parseDateLike(record.date, 'Control date is required'),
    specialty: parseNonEmptyString(record.specialty, 'Control specialty is required'),
    doctor: parseNonEmptyString(record.doctor, 'Control doctor is required'),
    type: parseNonEmptyString(record.type, 'Control type is required'),
    relatedAppointmentId: parseNonEmptyString(
      record.relatedAppointmentId,
      'Related appointment id is required',
    ),
  };
}
