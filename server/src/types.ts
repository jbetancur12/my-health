export type DocumentType =
  | 'historia_clinica'
  | 'orden_procedimiento'
  | 'orden_medicamento'
  | 'orden_control'
  | 'laboratorio';

export interface AppointmentDocumentInput {
  id: string;
  type: DocumentType;
  name: string;
  date: string | Date;
}

export interface AppointmentInput {
  date: string | Date;
  specialty: string;
  doctor: string;
  notes?: string;
  tags?: string[];
  documents: AppointmentDocumentInput[];
}

export interface ControlInput {
  date: string | Date;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
}

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string | Date;
  endDate?: string | Date;
  notes?: string;
  active: boolean;
}

export interface EmergencyContactInput {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface InsuranceInfoInput {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface MedicalProfileInput {
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContacts?: EmergencyContactInput[];
  insurance?: InsuranceInfoInput;
  notes?: string;
}

export interface NotificationPreferenceInput {
  email?: string;
  phone?: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  reminderDays?: number[];
}

export interface TagDefinitionInput {
  name: string;
  color: string;
}

export interface VitalSignInput {
  date: string | Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  glucose?: number;
  temperature?: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface VaccineInput {
  name: string;
  date: string | Date;
  nextDose?: string | Date;
  doseNumber?: number;
  totalDoses?: number;
  location?: string;
  lot?: string;
  notes?: string;
}

export interface AppDataImportInput {
  appointments?: AppointmentInput[];
  controls?: ControlInput[];
  medications?: MedicationInput[];
  tags?: TagDefinitionInput[];
  medicalProfile?: MedicalProfileInput;
  notificationPreferences?: NotificationPreferenceInput;
  vitalSigns?: VitalSignInput[];
  vaccines?: VaccineInput[];
}
