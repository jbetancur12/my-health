import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Appointment } from './Appointment.js';

export enum DocumentType {
  HISTORIA_CLINICA = 'historia_clinica',
  ORDEN_PROCEDIMIENTO = 'orden_procedimiento',
  ORDEN_MEDICAMENTO = 'orden_medicamento',
  ORDEN_CONTROL = 'orden_control',
  LABORATORIO = 'laboratorio',
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

  @ManyToOne(() => Appointment)
  appointment!: Appointment;
}
