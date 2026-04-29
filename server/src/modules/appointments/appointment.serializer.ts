import { Appointment } from '../../entities/Appointment.js';
import type { AppointmentDto } from '../../../../shared/contracts/http.js';
import { serializeAppointmentDocument } from '../uploads/document.serializer.js';

export function serializeAppointment(appointment: Appointment): AppointmentDto {
  return {
    id: appointment.id,
    date: appointment.date.toISOString(),
    specialty: appointment.specialty,
    doctor: appointment.doctor,
    notes: appointment.notes,
    tags: appointment.tags,
    createdAt: appointment.createdAt.toISOString(),
    documents: appointment.documents
      .getItems()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(serializeAppointmentDocument),
  };
}
