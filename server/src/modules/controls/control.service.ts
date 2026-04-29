import { Appointment } from '../../entities/Appointment.js';
import { Control } from '../../entities/Control.js';
import { getOrm } from '../../orm.js';
import { serializeControl } from './control.serializer.js';
import type { ControlInput } from './control.types.js';
import { createControlEntity } from '../shared/entity-factories.js';

export async function listControls() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const controls = await em.find(Control, {}, { orderBy: { date: 'asc' } });

  return controls.map(serializeControl);
}

export async function createControl(input: ControlInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const appointment = await em.findOne(Appointment, { id: input.relatedAppointmentId });

  if (!appointment) {
    return null;
  }

  const control = createControlEntity(input, appointment.id);
  control.appointment = appointment;

  em.persist(control);
  await em.flush();

  return serializeControl(control);
}

export async function updateControl(id: string, input: ControlInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const control = await em.findOne(Control, { id });
  const appointment = await em.findOne(Appointment, { id: input.relatedAppointmentId });

  if (!control || !appointment) {
    return null;
  }

  control.date = new Date(input.date);
  control.specialty = input.specialty.trim();
  control.doctor = input.doctor.trim();
  control.type = input.type.trim();
  control.relatedAppointmentId = appointment.id;
  control.appointment = appointment;

  await em.flush();

  return serializeControl(control);
}

export async function deleteControl(id: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const control = await em.findOne(Control, { id });

  if (!control) {
    return false;
  }

  await em.removeAndFlush(control);
  return true;
}
