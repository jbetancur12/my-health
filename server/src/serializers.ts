import { Appointment } from './entities/Appointment.js';
import { Control } from './entities/Control.js';
import { Medication } from './entities/Medication.js';

export function serializeAppointment(appointment: Appointment) {
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
        fileUrl: document.fileUrl,
      })),
  };
}

export function serializeControl(control: Control) {
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

export function serializeMedication(medication: Medication) {
  return {
    id: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: medication.startDate.toISOString(),
    endDate: medication.endDate?.toISOString(),
    notes: medication.notes,
    active: medication.active,
    createdAt: medication.createdAt.toISOString(),
  };
}
