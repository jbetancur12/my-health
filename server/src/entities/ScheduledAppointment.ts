import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { AppointmentDocumentDto, ScheduledAppointmentStatus } from '../../../shared/contracts/http.js';

@Entity({ tableName: 'scheduled_appointments' })
export class ScheduledAppointment {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Property({ type: 'string' })
  specialty!: string;

  @Property({ type: 'string' })
  doctor!: string;

  @Property({ type: 'string', nullable: true })
  location?: string;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'json' })
  expectedDocuments: AppointmentDocumentDto[] = [];

  @Property({ type: 'string' })
  status: ScheduledAppointmentStatus = 'scheduled';

  @Property({ type: 'json' })
  reminderSentOffsets: number[] = [];

  @Property({ type: 'timestamptz', nullable: true })
  lastWhatsappReminderAt?: Date;

  @Property({ type: 'text', nullable: true })
  lastWhatsappReminderError?: string;

  @Property({ type: 'uuid', nullable: true })
  convertedAppointmentId?: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt = new Date();
}
