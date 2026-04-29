import type {
  AppDataBundle,
  AppDataBundleApiDto,
  Appointment,
  AppointmentApiDto,
  AppointmentApiPayload,
  AppointmentTag,
  AppointmentTagApiDto,
  Control,
  ControlApiDto,
  ControlApiPayload,
  Medication,
  MedicationApiDto,
  MedicationApiPayload,
  MedicalProfile,
  MedicalProfileApiDto,
  MedicalProfileApiPayload,
  NotificationPreferences,
  NotificationPreferencesApiDto,
  NotificationPreferencesApiPayload,
  Vaccine,
  VaccineApiDto,
  VaccineApiPayload,
  VitalSignReading,
  VitalSignApiDto,
  VitalSignApiPayload,
} from './contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type {
  AppDataBundle,
  Appointment,
  AppointmentTag,
  Control,
  Document,
  DocumentType,
  EmergencyContact,
  InsuranceInfo,
  Medication,
  MedicalProfile,
  NotificationPreferences,
  Vaccine,
  VitalSignReading,
} from './contracts';

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

function parseAppointment(appointment: AppointmentApiDto): Appointment {
  return {
    ...appointment,
    date: new Date(appointment.date),
    documents: appointment.documents.map((document) => ({
      ...document,
      date: new Date(document.date),
    })),
  };
}

function parseControl(control: ControlApiDto): Control {
  return {
    ...control,
    date: new Date(control.date),
  };
}

function parseMedication(medication: MedicationApiDto): Medication {
  return {
    ...medication,
    startDate: new Date(medication.startDate),
    endDate: medication.endDate ? new Date(medication.endDate) : undefined,
  };
}

function parseVitalSign(vitalSign: VitalSignApiDto): VitalSignReading {
  return {
    ...vitalSign,
    date: new Date(vitalSign.date),
  };
}

function parseVaccine(vaccine: VaccineApiDto): Vaccine {
  return {
    ...vaccine,
    date: new Date(vaccine.date),
    nextDose: vaccine.nextDose ? new Date(vaccine.nextDose) : undefined,
  };
}

function parseMedicalProfile(profile: MedicalProfileApiDto): MedicalProfile {
  return {
    ...profile,
    emergencyContacts: (profile.emergencyContacts ?? []).map((contact) => ({
      ...contact,
      id: contact.id ?? crypto.randomUUID(),
    })),
  };
}

export async function getAppointments(): Promise<Appointment[]> {
  const data = (await fetchAPI('/appointments')) as { appointments: AppointmentApiDto[] };
  return data.appointments.map(parseAppointment);
}

export async function saveAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
  const payload: AppointmentApiPayload = {
    date: appointment.date.toISOString(),
    specialty: appointment.specialty,
    doctor: appointment.doctor,
    notes: appointment.notes,
    tags: appointment.tags,
    documents: appointment.documents.map((document) => ({
      id: document.id,
      type: document.type,
      name: document.name,
      date: document.date.toISOString(),
    })),
  };
  const data = await fetchAPI('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseAppointment((data as { appointment: AppointmentApiDto }).appointment);
}

export async function updateAppointment(
  id: string,
  appointment: Partial<Appointment>
): Promise<Appointment> {
  const payload = serializeAppointmentUpdate(appointment);
  const data = await fetchAPI(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return parseAppointment((data as { appointment: AppointmentApiDto }).appointment);
}

export async function getControls(): Promise<Control[]> {
  const data = (await fetchAPI('/controls')) as { controls: ControlApiDto[] };
  return data.controls.map(parseControl);
}

export async function saveControl(control: Omit<Control, 'id'>): Promise<Control> {
  const payload: ControlApiPayload = {
    date: control.date.toISOString(),
    specialty: control.specialty,
    doctor: control.doctor,
    type: control.type,
    relatedAppointmentId: control.relatedAppointmentId,
  };
  const data = await fetchAPI('/controls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseControl((data as { control: ControlApiDto }).control);
}

export async function uploadFile(
  file: File,
  appointmentId: string,
  documentId: string
): Promise<string> {
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
  const data = (await fetchAPI('/medications')) as { medications: MedicationApiDto[] };
  return data.medications.map(parseMedication);
}

export async function saveMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
  const payload: MedicationApiPayload = {
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: medication.startDate.toISOString(),
    endDate: medication.endDate?.toISOString(),
    notes: medication.notes,
    active: medication.active,
  };
  const data = await fetchAPI('/medications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return parseMedication((data as { medication: MedicationApiDto }).medication);
}

export async function updateMedication(
  id: string,
  medication: Partial<Medication>
): Promise<Medication> {
  const payload = serializeMedicationUpdate(medication);
  const data = await fetchAPI(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return parseMedication((data as { medication: MedicationApiDto }).medication);
}

export async function deleteMedication(id: string): Promise<void> {
  await fetchAPI(`/medications/${id}`, {
    method: 'DELETE',
  });
}

export async function getMedicalProfile(): Promise<MedicalProfile> {
  const data = (await fetchAPI('/medical-profile')) as { medicalProfile: MedicalProfileApiDto };
  return parseMedicalProfile(data.medicalProfile);
}

export async function saveMedicalProfile(profile: MedicalProfile): Promise<MedicalProfile> {
  const payload: MedicalProfileApiPayload = {
    bloodType: profile.bloodType,
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    emergencyContacts: profile.emergencyContacts,
    insurance: profile.insurance,
    notes: profile.notes,
  };
  const data = await fetchAPI('/medical-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseMedicalProfile((data as { medicalProfile: MedicalProfileApiDto }).medicalProfile);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const data = (await fetchAPI('/notification-preferences')) as {
    notificationPreferences: NotificationPreferencesApiDto;
  };
  return data.notificationPreferences;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const payload: NotificationPreferencesApiPayload = {
    email: preferences.email,
    phone: preferences.phone,
    emailEnabled: preferences.emailEnabled,
    smsEnabled: preferences.smsEnabled,
    reminderDays: preferences.reminderDays,
  };
  const data = await fetchAPI('/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return (data as { notificationPreferences: NotificationPreferencesApiDto })
    .notificationPreferences;
}

export async function getTags(): Promise<AppointmentTag[]> {
  const data = (await fetchAPI('/tags')) as { tags: AppointmentTagApiDto[] };
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
  const data = (await fetchAPI('/vital-signs')) as { vitalSigns: VitalSignApiDto[] };
  return data.vitalSigns.map(parseVitalSign);
}

export async function saveVitalSign(
  reading: Omit<VitalSignReading, 'id'>
): Promise<VitalSignReading> {
  const payload: VitalSignApiPayload = {
    date: reading.date.toISOString(),
    bloodPressureSystolic: reading.bloodPressureSystolic,
    bloodPressureDiastolic: reading.bloodPressureDiastolic,
    heartRate: reading.heartRate,
    weight: reading.weight,
    glucose: reading.glucose,
    temperature: reading.temperature,
    oxygenSaturation: reading.oxygenSaturation,
    notes: reading.notes,
  };
  const data = await fetchAPI('/vital-signs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseVitalSign((data as { vitalSign: VitalSignApiDto }).vitalSign);
}

export async function deleteVitalSign(id: string): Promise<void> {
  await fetchAPI(`/vital-signs/${id}`, {
    method: 'DELETE',
  });
}

export async function getVaccines(): Promise<Vaccine[]> {
  const data = (await fetchAPI('/vaccines')) as { vaccines: VaccineApiDto[] };
  return data.vaccines.map(parseVaccine);
}

export async function saveVaccine(vaccine: Omit<Vaccine, 'id'>): Promise<Vaccine> {
  const payload: VaccineApiPayload = {
    name: vaccine.name,
    date: vaccine.date.toISOString(),
    nextDose: vaccine.nextDose?.toISOString(),
    doseNumber: vaccine.doseNumber,
    totalDoses: vaccine.totalDoses,
    location: vaccine.location,
    lot: vaccine.lot,
    notes: vaccine.notes,
  };
  const data = await fetchAPI('/vaccines', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseVaccine((data as { vaccine: VaccineApiDto }).vaccine);
}

export async function deleteVaccine(id: string): Promise<void> {
  await fetchAPI(`/vaccines/${id}`, {
    method: 'DELETE',
  });
}

export async function importAppData(bundle: Partial<AppDataBundle>): Promise<AppDataBundle> {
  const payload = serializeAppDataImport(bundle);
  const data = await fetchAPI('/app-data/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const typedData = data as AppDataBundleApiDto;

  return {
    appointments: typedData.appointments.map(parseAppointment),
    controls: typedData.controls.map(parseControl),
    medications: typedData.medications.map(parseMedication),
    tags: typedData.tags,
    medicalProfile: parseMedicalProfile(typedData.medicalProfile),
    notificationPreferences: typedData.notificationPreferences,
    vitalSigns: typedData.vitalSigns.map(parseVitalSign),
    vaccines: typedData.vaccines.map(parseVaccine),
  };
}

function serializeAppointmentUpdate(appointment: Partial<Appointment>) {
  const payload: Partial<AppointmentApiPayload> = {};
  if (appointment.date) payload.date = appointment.date.toISOString();
  if (appointment.specialty !== undefined) payload.specialty = appointment.specialty;
  if (appointment.doctor !== undefined) payload.doctor = appointment.doctor;
  if (appointment.notes !== undefined) payload.notes = appointment.notes;
  if (appointment.tags !== undefined) payload.tags = appointment.tags;
  if (appointment.documents !== undefined) {
    payload.documents = appointment.documents.map((document) => ({
      id: document.id,
      type: document.type,
      name: document.name,
      date: document.date.toISOString(),
    }));
  }
  return payload;
}

function serializeMedicationUpdate(medication: Partial<Medication>) {
  const payload: Partial<MedicationApiPayload> = {};
  if (medication.name !== undefined) payload.name = medication.name;
  if (medication.dosage !== undefined) payload.dosage = medication.dosage;
  if (medication.frequency !== undefined) payload.frequency = medication.frequency;
  if (medication.startDate !== undefined) payload.startDate = medication.startDate.toISOString();
  if (medication.endDate !== undefined) payload.endDate = medication.endDate?.toISOString();
  if (medication.notes !== undefined) payload.notes = medication.notes;
  if (medication.active !== undefined) payload.active = medication.active;
  return payload;
}

function serializeAppDataImport(bundle: Partial<AppDataBundle>) {
  return {
    appointments: bundle.appointments?.map((appointment) => ({
      date: appointment.date.toISOString(),
      specialty: appointment.specialty,
      doctor: appointment.doctor,
      notes: appointment.notes,
      tags: appointment.tags,
      documents: appointment.documents.map((document) => ({
        id: document.id,
        type: document.type,
        name: document.name,
        date: document.date.toISOString(),
      })),
    })),
    controls: bundle.controls?.map((control) => ({
      date: control.date.toISOString(),
      specialty: control.specialty,
      doctor: control.doctor,
      type: control.type,
      relatedAppointmentId: control.relatedAppointmentId,
    })),
    medications: bundle.medications?.map((medication) => ({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate.toISOString(),
      endDate: medication.endDate?.toISOString(),
      notes: medication.notes,
      active: medication.active,
    })),
    tags: bundle.tags?.map((tag) => ({ name: tag.name, color: tag.color })),
    medicalProfile: bundle.medicalProfile,
    notificationPreferences: bundle.notificationPreferences,
    vitalSigns: bundle.vitalSigns?.map((vitalSign) => ({
      date: vitalSign.date.toISOString(),
      bloodPressureSystolic: vitalSign.bloodPressureSystolic,
      bloodPressureDiastolic: vitalSign.bloodPressureDiastolic,
      heartRate: vitalSign.heartRate,
      weight: vitalSign.weight,
      glucose: vitalSign.glucose,
      temperature: vitalSign.temperature,
      oxygenSaturation: vitalSign.oxygenSaturation,
      notes: vitalSign.notes,
    })),
    vaccines: bundle.vaccines?.map((vaccine) => ({
      name: vaccine.name,
      date: vaccine.date.toISOString(),
      nextDose: vaccine.nextDose?.toISOString(),
      doseNumber: vaccine.doseNumber,
      totalDoses: vaccine.totalDoses,
      location: vaccine.location,
      lot: vaccine.lot,
      notes: vaccine.notes,
    })),
  };
}
