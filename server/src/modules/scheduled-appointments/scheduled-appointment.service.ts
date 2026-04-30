import { ScheduledAppointment } from '../../entities/ScheduledAppointment.js';
import { getOrm } from '../../orm.js';
import { createScheduledAppointmentEntity, updateScheduledAppointmentEntity } from '../shared/entity-factories.js';
import { serializeScheduledAppointment } from './scheduled-appointment.serializer.js';
import type { ScheduledAppointmentInput } from './scheduled-appointment.types.js';

export async function listScheduledAppointments() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scheduledAppointments = await em.find(
    ScheduledAppointment,
    {},
    {
      orderBy: { scheduledAt: 'asc' },
    }
  );

  return scheduledAppointments.map(serializeScheduledAppointment);
}

export async function createScheduledAppointment(input: ScheduledAppointmentInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scheduledAppointment = createScheduledAppointmentEntity(input);

  em.persist(scheduledAppointment);
  await em.flush();

  return serializeScheduledAppointment(scheduledAppointment);
}

export async function updateScheduledAppointment(
  id: string,
  input: Partial<ScheduledAppointmentInput>
) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scheduledAppointment = await em.findOne(ScheduledAppointment, { id });

  if (!scheduledAppointment) {
    return null;
  }

  updateScheduledAppointmentEntity(scheduledAppointment, input);
  await em.flush();

  return serializeScheduledAppointment(scheduledAppointment);
}

export async function deleteScheduledAppointment(id: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scheduledAppointment = await em.findOne(ScheduledAppointment, { id });

  if (!scheduledAppointment) {
    return false;
  }

  em.remove(scheduledAppointment);
  await em.flush();
  return true;
}

export async function convertScheduledAppointment(id: string, appointmentId: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scheduledAppointment = await em.findOne(ScheduledAppointment, { id });

  if (!scheduledAppointment) {
    return null;
  }

  scheduledAppointment.status = 'converted';
  scheduledAppointment.convertedAppointmentId = appointmentId;
  scheduledAppointment.lastWhatsappReminderError = undefined;
  await em.flush();

  return serializeScheduledAppointment(scheduledAppointment);
}
