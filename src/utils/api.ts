const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface Document {
  id: string;
  type: 'historia_clinica' | 'orden_procedimiento' | 'orden_medicamento' | 'orden_control' | 'laboratorio';
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

export interface MedicalProfile {
  id?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
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

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error on ${endpoint}: ${response.status} - ${errorText}`);
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function parseAppointment(appointment: any): Appointment {
  return {
    ...appointment,
    date: new Date(appointment.date),
    documents: appointment.documents.map((document: any) => ({
      ...document,
      date: new Date(document.date),
    })),
  };
}

function parseControl(control: any): Control {
  return {
    ...control,
    date: new Date(control.date),
  };
}

function parseMedication(medication: any): Medication {
  return {
    ...medication,
    startDate: new Date(medication.startDate),
    endDate: medication.endDate ? new Date(medication.endDate) : undefined,
  };
}

function parseVitalSign(vitalSign: any): VitalSignReading {
  return {
    ...vitalSign,
    date: new Date(vitalSign.date),
  };
}

function parseVaccine(vaccine: any): Vaccine {
  return {
    ...vaccine,
    date: new Date(vaccine.date),
    nextDose: vaccine.nextDose ? new Date(vaccine.nextDose) : undefined,
  };
}

export async function getAppointments(): Promise<Appointment[]> {
  const data = await fetchAPI('/appointments');
  return data.appointments.map(parseAppointment);
}

export async function saveAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
  const data = await fetchAPI('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  });
  return parseAppointment(data.appointment);
}

export async function updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
  const data = await fetchAPI(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  });

  return parseAppointment(data.appointment);
}

export async function getControls(): Promise<Control[]> {
  const data = await fetchAPI('/controls');
  return data.controls.map(parseControl);
}

export async function saveControl(control: Omit<Control, 'id'>): Promise<Control> {
  const data = await fetchAPI('/controls', {
    method: 'POST',
    body: JSON.stringify(control),
  });
  return parseControl(data.control);
}

export async function uploadFile(file: File, appointmentId: string, documentId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('appointmentId', appointmentId);
  formData.append('documentId', documentId);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Upload error: ${response.status} - ${errorText}`);
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.fileUrl;
}

export async function getMedications(): Promise<Medication[]> {
  const data = await fetchAPI('/medications');
  return data.medications.map(parseMedication);
}

export async function saveMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
  const data = await fetchAPI('/medications', {
    method: 'POST',
    body: JSON.stringify(medication),
  });

  return parseMedication(data.medication);
}

export async function updateMedication(id: string, medication: Partial<Medication>): Promise<Medication> {
  const data = await fetchAPI(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(medication),
  });

  return parseMedication(data.medication);
}

export async function deleteMedication(id: string): Promise<void> {
  await fetchAPI(`/medications/${id}`, {
    method: 'DELETE',
  });
}

export async function getMedicalProfile(): Promise<MedicalProfile> {
  const data = await fetchAPI('/medical-profile');
  return data.medicalProfile;
}

export async function saveMedicalProfile(profile: MedicalProfile): Promise<MedicalProfile> {
  const data = await fetchAPI('/medical-profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  return data.medicalProfile;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const data = await fetchAPI('/notification-preferences');
  return data.notificationPreferences;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const data = await fetchAPI('/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
  return data.notificationPreferences;
}

export async function getTags(): Promise<AppointmentTag[]> {
  const data = await fetchAPI('/tags');
  return data.tags;
}

export async function saveTag(tag: Omit<AppointmentTag, 'id'>): Promise<AppointmentTag> {
  const data = await fetchAPI('/tags', {
    method: 'POST',
    body: JSON.stringify(tag),
  });
  return data.tag;
}

export async function getVitalSigns(): Promise<VitalSignReading[]> {
  const data = await fetchAPI('/vital-signs');
  return data.vitalSigns.map(parseVitalSign);
}

export async function saveVitalSign(reading: Omit<VitalSignReading, 'id'>): Promise<VitalSignReading> {
  const data = await fetchAPI('/vital-signs', {
    method: 'POST',
    body: JSON.stringify(reading),
  });
  return parseVitalSign(data.vitalSign);
}

export async function deleteVitalSign(id: string): Promise<void> {
  await fetchAPI(`/vital-signs/${id}`, {
    method: 'DELETE',
  });
}

export async function getVaccines(): Promise<Vaccine[]> {
  const data = await fetchAPI('/vaccines');
  return data.vaccines.map(parseVaccine);
}

export async function saveVaccine(vaccine: Omit<Vaccine, 'id'>): Promise<Vaccine> {
  const data = await fetchAPI('/vaccines', {
    method: 'POST',
    body: JSON.stringify(vaccine),
  });
  return parseVaccine(data.vaccine);
}

export async function deleteVaccine(id: string): Promise<void> {
  await fetchAPI(`/vaccines/${id}`, {
    method: 'DELETE',
  });
}

export async function importAppData(bundle: Partial<AppDataBundle>): Promise<AppDataBundle> {
  const data = await fetchAPI('/app-data/import', {
    method: 'POST',
    body: JSON.stringify(bundle),
  });

  return {
    appointments: data.appointments.map(parseAppointment),
    controls: data.controls.map(parseControl),
    medications: data.medications.map(parseMedication),
    tags: data.tags,
    medicalProfile: data.medicalProfile,
    notificationPreferences: data.notificationPreferences,
    vitalSigns: data.vitalSigns.map(parseVitalSign),
    vaccines: data.vaccines.map(parseVaccine),
  };
}
