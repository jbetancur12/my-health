import { Medication } from '../../entities/Medication.js';
import { getOrm } from '../../orm.js';
import { serializeMedication } from './medication.serializer.js';
import type { MedicationInput } from './medication.types.js';
import { createMedicationEntity, updateMedicationEntity } from '../shared/entity-factories.js';

export async function listMedications() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const medications = await em.find(Medication, {}, { orderBy: { createdAt: 'desc' } });

  return medications.map(serializeMedication);
}

export async function createMedication(input: MedicationInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const medication = createMedicationEntity(input);

  em.persist(medication);
  await em.flush();

  return serializeMedication(medication);
}

export async function updateMedication(id: string, input: Partial<MedicationInput>) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const medication = await em.findOne(Medication, { id });

  if (!medication) {
    return null;
  }

  updateMedicationEntity(medication, input);
  await em.flush();

  return serializeMedication(medication);
}

export async function deleteMedication(id: string) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const medication = await em.findOne(Medication, { id });

  if (!medication) {
    return false;
  }

  await em.removeAndFlush(medication);
  return true;
}
