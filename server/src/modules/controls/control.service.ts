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
