import { NotificationPreference } from '../../entities/NotificationPreference.js';
import { getOrm } from '../../orm.js';
import { serializeNotificationPreference } from './notification-preference.serializer.js';
import type { NotificationPreferenceInput } from './notification-preference.types.js';
import { updateNotificationPreferenceEntity } from '../shared/entity-factories.js';
import { findFirst } from '../shared/find-first.js';

export async function getNotificationPreferences() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const preferences = (await findFirst(
    em,
    NotificationPreference,
    { createdAt: 'asc' },
  )) as NotificationPreference | null;

  return serializeNotificationPreference(preferences);
}

export async function upsertNotificationPreferences(input: NotificationPreferenceInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  let preferences = (await findFirst(
    em,
    NotificationPreference,
    { createdAt: 'asc' },
  )) as NotificationPreference | null;

  if (!preferences) {
    preferences = new NotificationPreference();
    preferences.id = crypto.randomUUID();
    em.persist(preferences);
  }

  updateNotificationPreferenceEntity(preferences, input);
  await em.flush();

  return serializeNotificationPreference(preferences);
}
