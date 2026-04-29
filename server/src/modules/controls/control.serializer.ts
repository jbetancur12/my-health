import { Control } from '../../entities/Control.js';
import type { ControlDto } from '../../../../shared/contracts/http.js';

export function serializeControl(control: Control): ControlDto {
  return {
    id: control.id,
    date: control.date.toISOString(),
    specialty: control.specialty,
    doctor: control.doctor,
    type: control.type,
    relatedAppointmentId: control.relatedAppointmentId,
    createdAt: control.createdAt.toISOString(),
  };
}
