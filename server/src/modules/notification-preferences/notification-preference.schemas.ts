import type { NotificationPreferenceInput } from './notification-preference.types.js';
import {
  parseArray,
  parseBoolean,
  parseObject,
  parseOptionalString,
  ValidationError,
} from '../shared/validation.js';

export function parseNotificationPreferenceInput(input: unknown): NotificationPreferenceInput {
  const record = parseObject(input, 'Invalid notification preferences payload');

  return {
    email: parseOptionalString(record.email),
    phone: parseOptionalString(record.phone),
    emailEnabled: parseBoolean(record.emailEnabled, 'Notification emailEnabled flag is required'),
    smsEnabled: parseBoolean(record.smsEnabled, 'Notification smsEnabled flag is required'),
    reminderDays: parseReminderDays(record.reminderDays),
  };
}

function parseReminderDays(input: unknown) {
  return parseArray(input, 'Notification reminderDays must be an array').map((day) => {
    if (typeof day !== 'number' || Number.isNaN(day)) {
      throw new ValidationError('Notification reminderDays must contain numbers');
    }

    return day;
  });
}
