import { Vaccine } from '../../entities/Vaccine.js';
import { getOrm } from '../../orm.js';
import { serializeVaccine } from './vaccine.serializer.js';
import type { VaccineInput } from './vaccine.types.js';
import { createVaccineEntity } from '../shared/entity-factories.js';

export async function listVaccines() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vaccines = await em.find(Vaccine, {}, { orderBy: { date: 'desc' } });

  return vaccines.map(serializeVaccine);
}

export async function createVaccine(input: VaccineInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vaccine = createVaccineEntity(input);

  em.persist(vaccine);
  await em.flush();

  return serializeVaccine(vaccine);
}

export async function deleteVaccine(id: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vaccine = await em.findOne(Vaccine, { id });

  if (!vaccine) {
    return false;
  }

  await em.removeAndFlush(vaccine);
  return true;
}
