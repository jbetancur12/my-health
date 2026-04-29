import { NotificationPreference } from '../../entities/NotificationPreference.js';
import type { NotificationPreferencesDto } from '../../../../shared/contracts/http.js';

export function serializeNotificationPreference(preference: NotificationPreference | null): NotificationPreferencesDto {
  if (!preference) {
    return {
      email: '',
      phone: '',
      emailEnabled: false,
      smsEnabled: false,
      reminderDays: [7, 3, 1],
    };
  }

  return {
    id: preference.id,
    email: preference.email ?? '',
    phone: preference.phone ?? '',
    emailEnabled: preference.emailEnabled,
    smsEnabled: preference.smsEnabled,
    reminderDays: preference.reminderDays,
    createdAt: preference.createdAt.toISOString(),
    updatedAt: preference.updatedAt.toISOString(),
  };
}
