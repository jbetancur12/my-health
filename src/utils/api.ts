const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface Appointment {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  documents: Document[];
  notes?: string;
  tags?: string[];
}

interface Document {
  id: string;
  type: 'historia_clinica' | 'orden_procedimiento' | 'orden_medicamento' | 'orden_control' | 'laboratorio';
  name: string;
  date: Date;
  file?: File;
  fileUrl?: string;
}

interface Control {
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

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const data = await fetchAPI('/appointments');
    return data.appointments.map((apt: any) => ({
      ...apt,
      date: new Date(apt.date),
      documents: apt.documents.map((doc: any) => ({
        ...doc,
        date: new Date(doc.date)
      }))
    }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

export async function saveAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
  try {
    const data = await fetchAPI('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return {
      ...data.appointment,
      date: new Date(data.appointment.date),
      documents: data.appointment.documents.map((doc: any) => ({
        ...doc,
        date: new Date(doc.date)
      }))
    };
  } catch (error) {
    console.error('Error saving appointment:', error);
    throw error;
  }
}

export async function updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
  const data = await fetchAPI(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  });

  return {
    ...data.appointment,
    date: new Date(data.appointment.date),
    documents: data.appointment.documents.map((doc: any) => ({
      ...doc,
      date: new Date(doc.date),
    })),
  };
}

export async function getControls(): Promise<Control[]> {
  try {
    const data = await fetchAPI('/controls');
    return data.controls.map((ctrl: any) => ({
      ...ctrl,
      date: new Date(ctrl.date)
    }));
  } catch (error) {
    console.error('Error fetching controls:', error);
    throw error;
  }
}

export async function saveControl(control: Omit<Control, 'id'>): Promise<Control> {
  try {
    const data = await fetchAPI('/controls', {
      method: 'POST',
      body: JSON.stringify(control),
    });
    return {
      ...data.control,
      date: new Date(data.control.date)
    };
  } catch (error) {
    console.error('Error saving control:', error);
    throw error;
  }
}

export async function uploadFile(file: File, appointmentId: string, documentId: string): Promise<string> {
  try {
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
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function getMedications(): Promise<Medication[]> {
  const data = await fetchAPI('/medications');
  return data.medications.map((medication: any) => ({
    ...medication,
    startDate: new Date(medication.startDate),
    endDate: medication.endDate ? new Date(medication.endDate) : undefined,
  }));
}

export async function saveMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
  const data = await fetchAPI('/medications', {
    method: 'POST',
    body: JSON.stringify(medication),
  });

  return {
    ...data.medication,
    startDate: new Date(data.medication.startDate),
    endDate: data.medication.endDate ? new Date(data.medication.endDate) : undefined,
  };
}

export async function updateMedication(id: string, medication: Partial<Medication>): Promise<Medication> {
  const data = await fetchAPI(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(medication),
  });

  return {
    ...data.medication,
    startDate: new Date(data.medication.startDate),
    endDate: data.medication.endDate ? new Date(data.medication.endDate) : undefined,
  };
}

export async function deleteMedication(id: string): Promise<void> {
  await fetchAPI(`/medications/${id}`, {
    method: 'DELETE',
  });
}
