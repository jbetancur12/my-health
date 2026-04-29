import { VitalSign } from '../../entities/VitalSign.js';
import { getOrm } from '../../orm.js';
import { serializeVitalSign } from './vital-sign.serializer.js';
import type { VitalSignInput } from './vital-sign.types.js';
import { createVitalSignEntity } from '../shared/entity-factories.js';

export async function listVitalSigns() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vitalSigns = await em.find(VitalSign, {}, { orderBy: { date: 'desc' } });

  return vitalSigns.map(serializeVitalSign);
}

export async function createVitalSign(input: VitalSignInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vitalSign = createVitalSignEntity(input);

  em.persist(vitalSign);
  await em.flush();

  return serializeVitalSign(vitalSign);
}

export async function deleteVitalSign(id: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const vitalSign = await em.findOne(VitalSign, { id });

  if (!vitalSign) {
    return false;
  }

  await em.removeAndFlush(vitalSign);
  return true;
}
