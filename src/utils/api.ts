import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-342e1137`;

interface Appointment {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  documents: Document[];
  notes?: string;
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

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error on ${endpoint}: ${response.status} - ${errorText}`);
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
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
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
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
