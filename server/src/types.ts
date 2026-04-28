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
