import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Appointment } from './Appointment.js';

export enum DocumentType {
  HISTORIA_CLINICA = 'historia_clinica',
  ORDEN_PROCEDIMIENTO = 'orden_procedimiento',
  ORDEN_MEDICAMENTO = 'orden_medicamento',
  ORDEN_CONTROL = 'orden_control',
  LABORATORIO = 'laboratorio',
}

export enum DocumentAiSummaryStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DocumentAiSummaryAction {
  GENERATED = 'generated',
  RETRIED = 'retried',
  REGENERATED = 'regenerated',
}

export type DocumentStructuredMedicationStatus = 'active' | 'suspended' | 'mentioned';

export interface DocumentStructuredMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  status: DocumentStructuredMedicationStatus;
  notes?: string;
}

export interface DocumentStructuredControl {
  description: string;
  interval?: string;
  suggestedSpecialty?: string;
}

export interface DocumentStructuredData {
  detectedDiagnoses: string[];
  detectedConditions: string[];
  detectedMedications: DocumentStructuredMedication[];
  detectedPendingStudies: string[];
  detectedControls: DocumentStructuredControl[];
  confidenceNotes: string[];
}

@Entity({ tableName: 'documents' })
export class Document {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Enum(() => DocumentType)
  type!: DocumentType;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'timestamptz' })
  date!: Date;

  @Property({ type: 'string', nullable: true })
  fileUrl?: string;

  @Property({ type: 'string', nullable: true })
  filePath?: string;

  @Property({ type: 'string', nullable: true })
  storageBucket?: string;

  @Property({ type: 'string', nullable: true })
  storageKey?: string;

  @Property({ type: 'text', nullable: true })
  aiSummary?: string;

  @Enum(() => DocumentAiSummaryStatus)
  aiSummaryStatus: DocumentAiSummaryStatus = DocumentAiSummaryStatus.IDLE;

  @Property({ type: 'text', nullable: true })
  aiSummaryError?: string;

  @Property({ type: 'timestamptz', nullable: true })
  aiSummaryUpdatedAt?: Date;

  @Property({ type: 'string', nullable: true })
  aiSummaryProvider?: 'openai' | 'gemini';

  @Property({ type: 'string', nullable: true })
  aiSummaryModel?: string;

  @Enum({ items: () => DocumentAiSummaryAction, nullable: true })
  aiSummaryLastAction?: DocumentAiSummaryAction;

  @Property({ type: 'json', nullable: true })
  aiStructuredData?: DocumentStructuredData;

  @ManyToOne(() => Appointment)
  appointment!: Appointment;
}
