import type {
  AppointmentDocumentDto,
  ScheduledAppointmentDto,
} from '../../../../shared/contracts/http.js';
import { ScheduledAppointment } from '../../entities/ScheduledAppointment.js';

function serializeExpectedDocument(document: ScheduledAppointment['expectedDocuments'][number]): AppointmentDocumentDto {
  return {
    id: document.id,
    type: document.type,
    name: document.name,
    date: document.date,
    aiSummaryStatus: document.aiSummaryStatus ?? 'idle',
  };
}

export function serializeScheduledAppointment(
  scheduledAppointment: ScheduledAppointment
): ScheduledAppointmentDto {
  return {
    id: scheduledAppointment.id,
    scheduledAt: scheduledAppointment.scheduledAt.toISOString(),
    specialty: scheduledAppointment.specialty,
    doctor: scheduledAppointment.doctor,
    location: scheduledAppointment.location,
    notes: scheduledAppointment.notes,
    expectedDocuments: scheduledAppointment.expectedDocuments.map(serializeExpectedDocument),
    status: scheduledAppointment.status,
    reminderSentOffsets: scheduledAppointment.reminderSentOffsets,
    lastWhatsappReminderAt: scheduledAppointment.lastWhatsappReminderAt?.toISOString(),
    lastWhatsappReminderError: scheduledAppointment.lastWhatsappReminderError,
    convertedAppointmentId: scheduledAppointment.convertedAppointmentId,
    createdAt: scheduledAppointment.createdAt.toISOString(),
    updatedAt: scheduledAppointment.updatedAt.toISOString(),
  };
}
