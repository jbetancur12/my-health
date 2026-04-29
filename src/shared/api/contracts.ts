import type {
  AppDataBundleDto,
  AppointmentDocumentPayload,
  AppointmentDto,
  AppointmentPayload,
  AppointmentTagDto,
  ControlDto,
  ControlPayload,
  DocumentType,
  MedicationDto,
  MedicationPayload,
  MedicalProfileDto,
  MedicalProfilePayload,
  NotificationPreferencesDto,
  NotificationPreferencePayload,
  VaccineDto,
  VaccinePayload,
  VitalSignDto,
  VitalSignPayload,
} from '../../../shared/contracts/http';

export type { DocumentType };

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  date: Date;
  file?: File;
  fileUrl?: string;
}

export interface Appointment {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  documents: Document[];
  notes?: string;
  tags?: string[];
}

export interface Control {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  active: boolean;
}

export interface AppointmentTag {
  id: string;
  name: string;
  color: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface MedicalProfile {
  id?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  insurance?: InsuranceInfo;
  notes?: string;
}

export interface NotificationPreferences {
  id?: string;
  email: string;
  phone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderDays: number[];
}

export interface VitalSignReading {
  id: string;
  date: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  glucose?: number;
  temperature?: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface Vaccine {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  doseNumber?: number;
  totalDoses?: number;
  location?: string;
  lot?: string;
  notes?: string;
}

export interface AppDataBundle {
  appointments: Appointment[];
  controls: Control[];
  medications: Medication[];
  tags: AppointmentTag[];
  medicalProfile: MedicalProfile;
  notificationPreferences: NotificationPreferences;
  vitalSigns: VitalSignReading[];
  vaccines: Vaccine[];
}

export type AppointmentApiPayload = AppointmentPayload;
export type ControlApiPayload = ControlPayload;
export type MedicationApiPayload = MedicationPayload;
export type MedicalProfileApiPayload = MedicalProfilePayload;
export type NotificationPreferencesApiPayload = NotificationPreferencePayload;
export type VitalSignApiPayload = VitalSignPayload;
export type VaccineApiPayload = VaccinePayload;
export type AppointmentApiDto = AppointmentDto;
export type ControlApiDto = ControlDto;
export type MedicationApiDto = MedicationDto;
export type AppointmentTagApiDto = AppointmentTagDto;
export type MedicalProfileApiDto = MedicalProfileDto;
export type NotificationPreferencesApiDto = NotificationPreferencesDto;
export type VitalSignApiDto = VitalSignDto;
export type VaccineApiDto = VaccineDto;
export type AppDataBundleApiDto = AppDataBundleDto;
export type AppointmentDocumentApiPayload = AppointmentDocumentPayload;
