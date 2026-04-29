import { Appointment } from '../../entities/Appointment.js';
import { Control } from '../../entities/Control.js';
import { Document } from '../../entities/Document.js';
import { Medication } from '../../entities/Medication.js';
import { MedicalProfile } from '../../entities/MedicalProfile.js';
import { NotificationPreference } from '../../entities/NotificationPreference.js';
import { TagDefinition } from '../../entities/TagDefinition.js';
import { Vaccine } from '../../entities/Vaccine.js';
import { VitalSign } from '../../entities/VitalSign.js';
import { getOrm } from '../../orm.js';
import { serializeAppointment } from '../appointments/appointment.serializer.js';
import { serializeControl } from '../controls/control.serializer.js';
import { serializeMedicalProfile } from '../medical-profile/medical-profile.serializer.js';
import { serializeMedication } from '../medications/medication.serializer.js';
import { serializeNotificationPreference } from '../notification-preferences/notification-preference.serializer.js';
import { serializeTagDefinition } from '../tags/tag.serializer.js';
import { serializeVaccine } from '../vaccines/vaccine.serializer.js';
import { serializeVitalSign } from '../vital-signs/vital-sign.serializer.js';
import type { AppDataBundleDto } from '../../../../shared/contracts/http.js';
import type { AppDataImportInput } from './app-data.types.js';
import {
  createAppointmentEntity,
  createControlEntity,
  createMedicationEntity,
  createTagDefinitionEntity,
  createVaccineEntity,
  createVitalSignEntity,
  updateMedicalProfileEntity,
  updateNotificationPreferenceEntity,
} from '../shared/entity-factories.js';
import { findFirst } from '../shared/find-first.js';

export async function importAppData(input: AppDataImportInput): Promise<AppDataBundleDto> {
  const orm = await getOrm();
  const em = orm.em.fork();

  await em.transactional(async (tx) => {
    await tx.nativeDelete(Control, {});
    await tx.nativeDelete(Document, {});
    await tx.nativeDelete(Appointment, {});
    await tx.nativeDelete(Medication, {});
    await tx.nativeDelete(VitalSign, {});
    await tx.nativeDelete(Vaccine, {});
    await tx.nativeDelete(TagDefinition, {});
    await tx.nativeDelete(MedicalProfile, {});
    await tx.nativeDelete(NotificationPreference, {});

    const appointments = (input.appointments ?? []).map((appointment) => createAppointmentEntity(appointment));
    const appointmentMap = new Map(appointments.map((appointment) => [appointment.id, appointment]));
    appointments.forEach((appointment) => tx.persist(appointment));

    for (const controlInput of input.controls ?? []) {
      const relatedAppointmentId = controlInput.relatedAppointmentId;
      const control = createControlEntity(controlInput, relatedAppointmentId);
      const appointment = appointmentMap.get(relatedAppointmentId);
      if (appointment) {
        control.appointment = appointment;
      }
      tx.persist(control);
    }

    for (const medicationInput of input.medications ?? []) {
      tx.persist(createMedicationEntity(medicationInput));
    }

    for (const tagInput of input.tags ?? []) {
      tx.persist(createTagDefinitionEntity(tagInput));
    }

    if (input.medicalProfile) {
      const profile = new MedicalProfile();
      profile.id = crypto.randomUUID();
      updateMedicalProfileEntity(profile, input.medicalProfile);
      tx.persist(profile);
    }

    if (input.notificationPreferences) {
      const preferences = new NotificationPreference();
      preferences.id = crypto.randomUUID();
      updateNotificationPreferenceEntity(preferences, input.notificationPreferences);
      tx.persist(preferences);
    }

    for (const vitalSignInput of input.vitalSigns ?? []) {
      tx.persist(createVitalSignEntity(vitalSignInput));
    }

    for (const vaccineInput of input.vaccines ?? []) {
      tx.persist(createVaccineEntity(vaccineInput));
    }
  });

  const freshEm = orm.em.fork();
  const [
    appointments,
    controls,
    medications,
    tags,
    medicalProfile,
    notificationPreferences,
    vitalSigns,
    vaccines,
  ] = await Promise.all([
    freshEm.find(Appointment, {}, { populate: ['documents'], orderBy: { date: 'desc' } }),
    freshEm.find(Control, {}, { orderBy: { date: 'asc' } }),
    freshEm.find(Medication, {}, { orderBy: { createdAt: 'desc' } }),
    freshEm.find(TagDefinition, {}, { orderBy: { createdAt: 'asc' } }),
    findFirst(freshEm, MedicalProfile, { createdAt: 'asc' }) as Promise<MedicalProfile | null>,
    findFirst(freshEm, NotificationPreference, { createdAt: 'asc' }) as Promise<NotificationPreference | null>,
    freshEm.find(VitalSign, {}, { orderBy: { date: 'desc' } }),
    freshEm.find(Vaccine, {}, { orderBy: { date: 'desc' } }),
  ]);

  return {
    appointments: appointments.map(serializeAppointment),
    controls: controls.map(serializeControl),
    medications: medications.map(serializeMedication),
    tags: tags.map(serializeTagDefinition),
    medicalProfile: serializeMedicalProfile(medicalProfile),
    notificationPreferences: serializeNotificationPreference(notificationPreferences),
    vitalSigns: vitalSigns.map(serializeVitalSign),
    vaccines: vaccines.map(serializeVaccine),
  };
}
