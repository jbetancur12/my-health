import type { AppDataImportInput } from './app-data.types.js';
import { parseObject, parseOptionalArray } from '../shared/validation.js';
import { parseAppointmentInput } from '../appointments/appointment.schemas.js';
import { parseControlInput } from '../controls/control.schemas.js';
import { parseMedicalProfileInput } from '../medical-profile/medical-profile.schemas.js';
import { parseMedicationInput } from '../medications/medication.schemas.js';
import { parseNotificationPreferenceInput } from '../notification-preferences/notification-preference.schemas.js';
import { parseTagInput } from '../tags/tag.schemas.js';
import { parseVaccineInput } from '../vaccines/vaccine.schemas.js';
import { parseVitalSignInput } from '../vital-signs/vital-sign.schemas.js';

export function parseAppDataImportInput(input: unknown): AppDataImportInput {
  const record = parseObject(input, 'Invalid app data payload');

  return {
    appointments: parseOptionalArray(record.appointments)?.map((item) =>
      parseAppointmentInput(item)
    ),
    controls: parseOptionalArray(record.controls)?.map((item) => parseControlInput(item)),
    medications: parseOptionalArray(record.medications)?.map((item) => parseMedicationInput(item)),
    tags: parseOptionalArray(record.tags)?.map((item) => parseTagInput(item)),
    medicalProfile:
      record.medicalProfile === undefined
        ? undefined
        : parseMedicalProfileInput(record.medicalProfile),
    notificationPreferences:
      record.notificationPreferences === undefined
        ? undefined
        : parseNotificationPreferenceInput(record.notificationPreferences),
    vitalSigns: parseOptionalArray(record.vitalSigns)?.map((item) => parseVitalSignInput(item)),
    vaccines: parseOptionalArray(record.vaccines)?.map((item) => parseVaccineInput(item)),
  };
}
