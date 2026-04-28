import { Appointment } from './entities/Appointment.js';
import { Control } from './entities/Control.js';
import { Medication } from './entities/Medication.js';
import { MedicalProfile } from './entities/MedicalProfile.js';
import { NotificationPreference } from './entities/NotificationPreference.js';
import { TagDefinition } from './entities/TagDefinition.js';
import { Vaccine } from './entities/Vaccine.js';
import { VitalSign } from './entities/VitalSign.js';

export function serializeAppointment(appointment: Appointment) {
  return {
    id: appointment.id,
    date: appointment.date.toISOString(),
    specialty: appointment.specialty,
    doctor: appointment.doctor,
    notes: appointment.notes,
    tags: appointment.tags,
    createdAt: appointment.createdAt.toISOString(),
    documents: appointment.documents
      .getItems()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((document) => ({
        id: document.id,
        type: document.type,
        name: document.name,
        date: document.date.toISOString(),
        fileUrl: document.fileUrl,
      })),
  };
}

export function serializeControl(control: Control) {
  return {
    id: control.id,
    date: control.date.toISOString(),
    specialty: control.specialty,
    doctor: control.doctor,
    type: control.type,
    relatedAppointmentId: control.relatedAppointmentId,
    createdAt: control.createdAt.toISOString(),
  };
}

export function serializeMedication(medication: Medication) {
  return {
    id: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: medication.startDate.toISOString(),
    endDate: medication.endDate?.toISOString(),
    notes: medication.notes,
    active: medication.active,
    createdAt: medication.createdAt.toISOString(),
  };
}

export function serializeMedicalProfile(profile: MedicalProfile | null) {
  if (!profile) {
    return {
      bloodType: undefined,
      allergies: [],
      chronicConditions: [],
      emergencyContacts: [],
      insurance: undefined,
      notes: undefined,
    };
  }

  return {
    id: profile.id,
    bloodType: profile.bloodType,
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    emergencyContacts: profile.emergencyContacts,
    insurance: profile.insurance,
    notes: profile.notes,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function serializeNotificationPreference(preference: NotificationPreference | null) {
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

export function serializeTagDefinition(tag: TagDefinition) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  };
}

export function serializeVaccine(vaccine: Vaccine) {
  return {
    id: vaccine.id,
    name: vaccine.name,
    date: vaccine.date.toISOString(),
    nextDose: vaccine.nextDose?.toISOString(),
    doseNumber: vaccine.doseNumber,
    totalDoses: vaccine.totalDoses,
    location: vaccine.location,
    lot: vaccine.lot,
    notes: vaccine.notes,
    createdAt: vaccine.createdAt.toISOString(),
  };
}

export function serializeVitalSign(vitalSign: VitalSign) {
  return {
    id: vitalSign.id,
    date: vitalSign.date.toISOString(),
    bloodPressureSystolic: vitalSign.bloodPressureSystolic,
    bloodPressureDiastolic: vitalSign.bloodPressureDiastolic,
    heartRate: vitalSign.heartRate,
    weight: vitalSign.weight,
    glucose: vitalSign.glucose,
    temperature: vitalSign.temperature,
    oxygenSaturation: vitalSign.oxygenSaturation,
    notes: vitalSign.notes,
    createdAt: vitalSign.createdAt.toISOString(),
  };
}
