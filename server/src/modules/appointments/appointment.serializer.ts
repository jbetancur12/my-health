import { Appointment } from '../../entities/Appointment.js';
import type { AppointmentDto } from '../../../../shared/contracts/http.js';

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
      .map((document) => ({
        id: document.id,
        type: document.type,
        name: document.name,
        date: document.date.toISOString(),
        fileUrl: document.storageBucket && document.storageKey
          ? `/api/documents/${document.id}/file`
          : document.fileUrl,
      })),
  };
}
