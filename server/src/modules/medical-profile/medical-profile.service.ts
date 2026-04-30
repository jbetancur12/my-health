import { MedicalProfile } from '../../entities/MedicalProfile.js';
import { getOrm } from '../../orm.js';
import { serializeMedicalProfile } from './medical-profile.serializer.js';
import type { MedicalProfileInput } from './medical-profile.types.js';
import { updateMedicalProfileEntity } from '../shared/entity-factories.js';
import { findFirst } from '../shared/find-first.js';
import { rebuildClinicalMemory } from '../clinical-memory/clinical-memory.service.js';

export async function getMedicalProfile() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const profile = (await findFirst(em, MedicalProfile, {
    createdAt: 'asc',
  })) as MedicalProfile | null;

  return serializeMedicalProfile(profile);
}

export async function upsertMedicalProfile(input: MedicalProfileInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  let profile = (await findFirst(em, MedicalProfile, {
    createdAt: 'asc',
  })) as MedicalProfile | null;

  if (!profile) {
    profile = new MedicalProfile();
    profile.id = crypto.randomUUID();
    em.persist(profile);
  }

  updateMedicalProfileEntity(profile, input);
  await em.flush();
  await rebuildClinicalMemory();

  return serializeMedicalProfile(profile);
}
