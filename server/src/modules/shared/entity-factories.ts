import { Appointment } from '../../entities/Appointment.js';
import { Control } from '../../entities/Control.js';
import { Document, DocumentType } from '../../entities/Document.js';
import { Medication } from '../../entities/Medication.js';
import { MedicalProfile } from '../../entities/MedicalProfile.js';
import { NotificationPreference } from '../../entities/NotificationPreference.js';
import { TagDefinition } from '../../entities/TagDefinition.js';
import { Vaccine } from '../../entities/Vaccine.js';
import { VitalSign } from '../../entities/VitalSign.js';
import { getOrm } from '../../orm.js';
import type { AppointmentInput } from '../appointments/appointment.types.js';
import type { ControlInput } from '../controls/control.types.js';
import type { AppDataImportInput } from '../app-data/app-data.types.js';
import type { MedicalProfileInput } from '../medical-profile/medical-profile.types.js';
import type { MedicationInput } from '../medications/medication.types.js';
import type { NotificationPreferenceInput } from '../notification-preferences/notification-preference.types.js';
import type { TagDefinitionInput } from '../tags/tag.types.js';
import type { VaccineInput } from '../vaccines/vaccine.types.js';
import type { VitalSignInput } from '../vital-signs/vital-sign.types.js';

export function createAppointmentEntity(input: AppointmentInput) {
  const maybeInput = input as AppointmentInput & { id?: string };
  const appointment = new Appointment();
  appointment.id = maybeInput.id || crypto.randomUUID();
  appointment.date = new Date(input.date);
  appointment.specialty = input.specialty.trim();
  appointment.doctor = input.doctor.trim();
  appointment.notes = input.notes?.trim() || undefined;
  appointment.tags = input.tags?.filter(Boolean) ?? [];

  for (const item of input.documents) {
    const document = new Document();
    document.id = item.id || crypto.randomUUID();
    document.type = item.type as DocumentType;
    document.name = item.name?.trim() || 'Documento sin nombre';
    document.date = new Date(item.date);
    document.appointment = appointment;
    appointment.documents.add(document);
  }

  return appointment;
}

export function updateAppointmentEntity(
  appointment: Appointment,
  input: Partial<AppointmentInput>,
  em: Awaited<ReturnType<typeof getOrm>>['em'],
) {
  if (input.date) appointment.date = new Date(input.date);
  if (input.specialty) appointment.specialty = input.specialty.trim();
  if (input.doctor) appointment.doctor = input.doctor.trim();
  appointment.notes = input.notes?.trim() || undefined;
  appointment.tags = input.tags?.filter(Boolean) ?? [];

  if (!Array.isArray(input.documents)) {
    return;
  }

  const incomingIds = new Set(input.documents.map((document) => document.id));
  for (const document of appointment.documents.getItems()) {
    if (!incomingIds.has(document.id)) {
      em.remove(document);
    }
  }

  for (const item of input.documents) {
    const existing = appointment.documents.getItems().find((document) => document.id === item.id);
    if (existing) {
      existing.type = item.type as DocumentType;
      existing.name = item.name?.trim() || 'Documento sin nombre';
      existing.date = new Date(item.date);
    } else {
      const document = new Document();
      document.id = item.id || crypto.randomUUID();
      document.type = item.type as DocumentType;
      document.name = item.name?.trim() || 'Documento sin nombre';
      document.date = new Date(item.date);
      document.appointment = appointment;
      appointment.documents.add(document);
    }
  }
}

export function createControlEntity(input: ControlInput, relatedAppointmentId: string) {
  const maybeInput = input as ControlInput & { id?: string };
  const control = new Control();
  control.id = maybeInput.id || crypto.randomUUID();
  control.date = new Date(input.date);
  control.specialty = input.specialty.trim();
  control.doctor = input.doctor.trim();
  control.type = input.type.trim();
  control.relatedAppointmentId = relatedAppointmentId;
  return control;
}

export function createMedicationEntity(input: MedicationInput) {
  const maybeInput = input as MedicationInput & { id?: string };
  const medication = new Medication();
  medication.id = maybeInput.id || crypto.randomUUID();
  medication.name = input.name.trim();
  medication.dosage = input.dosage.trim();
  medication.frequency = input.frequency.trim();
  medication.startDate = new Date(input.startDate);
  medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
  medication.notes = input.notes?.trim() || undefined;
  medication.active = Boolean(input.active);
  return medication;
}

export function updateMedicationEntity(medication: Medication, input: Partial<MedicationInput>) {
  if (input.name) medication.name = input.name.trim();
  if (input.dosage) medication.dosage = input.dosage.trim();
  if (input.frequency) medication.frequency = input.frequency.trim();
  if (input.startDate) medication.startDate = new Date(input.startDate);
  medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
  medication.notes = input.notes?.trim() || undefined;
  if (typeof input.active === 'boolean') medication.active = input.active;
}

export function updateMedicalProfileEntity(profile: MedicalProfile, input: MedicalProfileInput) {
  profile.bloodType = input.bloodType?.trim() || undefined;
  profile.allergies = (input.allergies ?? []).map((item) => item.trim()).filter(Boolean);
  profile.chronicConditions = (input.chronicConditions ?? []).map((item) => item.trim()).filter(Boolean);
  profile.emergencyContacts = (input.emergencyContacts ?? [])
    .map((contact) => ({
      id: contact.id || crypto.randomUUID(),
      name: contact.name.trim(),
      relationship: contact.relationship.trim(),
      phone: contact.phone.trim(),
    }))
    .filter((contact) => contact.name && contact.phone);
  profile.insurance = input.insurance?.provider?.trim()
    ? {
        provider: input.insurance.provider.trim(),
        policyNumber: input.insurance.policyNumber.trim(),
        groupNumber: input.insurance.groupNumber?.trim() || undefined,
      }
    : undefined;
  profile.notes = input.notes?.trim() || undefined;
}

export function updateNotificationPreferenceEntity(
  preferences: NotificationPreference,
  input: NotificationPreferenceInput,
) {
  preferences.email = input.email?.trim() || undefined;
  preferences.phone = input.phone?.trim() || undefined;
  preferences.emailEnabled = Boolean(input.emailEnabled);
  preferences.smsEnabled = Boolean(input.smsEnabled);
  preferences.reminderDays = (input.reminderDays ?? [7, 3, 1]).filter((day) => Number.isFinite(day));
}

export function createTagDefinitionEntity(input: TagDefinitionInput) {
  const maybeInput = input as TagDefinitionInput & { id?: string };
  const tag = new TagDefinition();
  tag.id = maybeInput.id || crypto.randomUUID();
  tag.name = input.name.trim();
  tag.color = input.color.trim();
  return tag;
}

export function createVitalSignEntity(input: VitalSignInput) {
  const maybeInput = input as VitalSignInput & { id?: string };
  const vitalSign = new VitalSign();
  vitalSign.id = maybeInput.id || crypto.randomUUID();
  vitalSign.date = new Date(input.date);
  vitalSign.bloodPressureSystolic = toOptionalNumber(input.bloodPressureSystolic);
  vitalSign.bloodPressureDiastolic = toOptionalNumber(input.bloodPressureDiastolic);
  vitalSign.heartRate = toOptionalNumber(input.heartRate);
  vitalSign.weight = toOptionalNumber(input.weight);
  vitalSign.glucose = toOptionalNumber(input.glucose);
  vitalSign.temperature = toOptionalNumber(input.temperature);
  vitalSign.oxygenSaturation = toOptionalNumber(input.oxygenSaturation);
  vitalSign.notes = input.notes?.trim() || undefined;
  return vitalSign;
}

export function createVaccineEntity(input: VaccineInput) {
  const maybeInput = input as VaccineInput & { id?: string };
  const vaccine = new Vaccine();
  vaccine.id = maybeInput.id || crypto.randomUUID();
  vaccine.name = input.name.trim();
  vaccine.date = new Date(input.date);
  vaccine.nextDose = input.nextDose ? new Date(input.nextDose) : undefined;
  vaccine.doseNumber = toOptionalNumber(input.doseNumber);
  vaccine.totalDoses = toOptionalNumber(input.totalDoses);
  vaccine.location = input.location?.trim() || undefined;
  vaccine.lot = input.lot?.trim() || undefined;
  vaccine.notes = input.notes?.trim() || undefined;
  return vaccine;
}

export function hasAppDataContent(input: AppDataImportInput | undefined) {
  if (!input) {
    return false;
  }

  return Boolean(
    (input.appointments?.length ?? 0) ||
      (input.controls?.length ?? 0) ||
      (input.medications?.length ?? 0) ||
      (input.tags?.length ?? 0) ||
      input.medicalProfile ||
      input.notificationPreferences ||
      (input.vitalSigns?.length ?? 0) ||
      (input.vaccines?.length ?? 0),
  );
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
