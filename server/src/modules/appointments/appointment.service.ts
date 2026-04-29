import { Appointment } from '../../entities/Appointment.js';
import { getOrm } from '../../orm.js';
import { serializeAppointment } from './appointment.serializer.js';
import type { AppointmentInput } from './appointment.types.js';
import {
  createAppointmentEntity,
  updateAppointmentEntity,
} from '../shared/entity-factories.js';

export async function listAppointments() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const appointments = await em.find(
    Appointment,
    {},
    {
      populate: ['documents'],
      orderBy: { date: 'desc' },
    },
  );

  return appointments.map(serializeAppointment);
}

export async function createAppointment(input: AppointmentInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const appointment = createAppointmentEntity(input);

  em.persist(appointment);
  await em.flush();
  await em.populate(appointment, ['documents']);

  return serializeAppointment(appointment);
}

export async function updateAppointment(id: string, input: Partial<AppointmentInput>) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const appointment = await em.findOne(Appointment, { id }, { populate: ['documents'] });

  if (!appointment) {
    return null;
  }

  updateAppointmentEntity(appointment, input, em);
  await em.flush();
  await em.populate(appointment, ['documents']);

  return serializeAppointment(appointment);
}
