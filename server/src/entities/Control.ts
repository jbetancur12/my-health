import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Appointment } from './Appointment.js';

@Entity({ tableName: 'controls' })
export class Control {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'timestamptz' })
  date!: Date;

  @Property({ type: 'string' })
  specialty!: string;

  @Property({ type: 'string' })
  doctor!: string;

  @Property({ type: 'string' })
  type!: string;

  @Property({ type: 'uuid' })
  relatedAppointmentId!: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @ManyToOne(() => Appointment)
  appointment!: Appointment;
}
