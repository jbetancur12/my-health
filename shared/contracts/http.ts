export type DocumentType =
  | 'historia_clinica'
  | 'orden_procedimiento'
  | 'orden_medicamento'
  | 'orden_control'
  | 'laboratorio';

export interface AppointmentDocumentPayload {
  id: string;
  type: DocumentType;
  name: string;
  date: string;
}

export interface AppointmentPayload {
  date: string;
  specialty: string;
  doctor: string;
  notes?: string;
  tags?: string[];
  documents: AppointmentDocumentPayload[];
}

export interface ControlPayload {
  date: string;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
}

export interface MedicationPayload {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  active: boolean;
}

export interface EmergencyContactPayload {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface InsuranceInfoPayload {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface MedicalProfilePayload {
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContacts?: EmergencyContactPayload[];
  insurance?: InsuranceInfoPayload;
  notes?: string;
}

export interface NotificationPreferencePayload {
  email?: string;
  phone?: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  reminderDays?: number[];
}

export interface TagDefinitionPayload {
  name: string;
  color: string;
}

export interface VitalSignPayload {
  date: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  glucose?: number;
  temperature?: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface VaccinePayload {
  name: string;
  date: string;
  nextDose?: string;
  doseNumber?: number;
  totalDoses?: number;
  location?: string;
  lot?: string;
  notes?: string;
}

export interface AppDataImportPayload {
  appointments?: AppointmentPayload[];
  controls?: ControlPayload[];
  medications?: MedicationPayload[];
  tags?: TagDefinitionPayload[];
  medicalProfile?: MedicalProfilePayload;
  notificationPreferences?: NotificationPreferencePayload;
  vitalSigns?: VitalSignPayload[];
  vaccines?: VaccinePayload[];
}

export interface AppointmentDocumentDto extends AppointmentDocumentPayload {
  fileUrl?: string;
  aiSummary?: string;
  aiSummaryStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  aiSummaryError?: string;
  aiSummaryUpdatedAt?: string;
}

export interface AppointmentDto {
  id: string;
  date: string;
  specialty: string;
  doctor: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  documents: AppointmentDocumentDto[];
}

export interface ControlDto {
  id: string;
  date: string;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
  createdAt: string;
}

export interface MedicationDto {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface AppointmentTagDto {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface MedicalProfileDto {
  id?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContactPayload[];
  insurance?: InsuranceInfoPayload;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationPreferencesDto {
  id?: string;
  email: string;
  phone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderDays: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VitalSignDto {
  id: string;
  date: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  glucose?: number;
  temperature?: number;
  oxygenSaturation?: number;
  notes?: string;
  createdAt: string;
}

export interface VaccineDto {
  id: string;
  name: string;
  date: string;
  nextDose?: string;
  doseNumber?: number;
  totalDoses?: number;
  location?: string;
  lot?: string;
  notes?: string;
  createdAt: string;
}

export interface AppDataBundleDto {
  appointments: AppointmentDto[];
  controls: ControlDto[];
  medications: MedicationDto[];
  tags: AppointmentTagDto[];
  medicalProfile: MedicalProfileDto;
  notificationPreferences: NotificationPreferencesDto;
  vitalSigns: VitalSignDto[];
  vaccines: VaccineDto[];
}

export type ReportDateRange = 'all' | '6months' | '1year';

export interface ExecutiveReportPayload {
  appointments: AppointmentDto[];
  medications: MedicationDto[];
  vaccines: VaccineDto[];
  vitalSigns: VitalSignDto[];
  medicalProfile: MedicalProfileDto;
  dateRange: ReportDateRange;
  includeProfile: boolean;
  includeAppointments: boolean;
  includeMedications: boolean;
  includeVaccines: boolean;
  includeVitals: boolean;
}

export interface ExecutiveReportDto {
  summary: string;
  generatedAt: string;
  provider: 'openai' | 'gemini';
}
