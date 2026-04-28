import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Document } from './Document.js';
import { Control } from './Control.js';

@Entity({ tableName: 'appointments' })
export class Appointment {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'timestamptz' })
  date!: Date;

  @Property({ type: 'string' })
  specialty!: string;

  @Property({ type: 'string' })
  doctor!: string;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'json', nullable: true })
  tags?: string[];

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @OneToMany(() => Document, (document) => document.appointment, {
    orphanRemoval: true,
  })
  documents = new Collection<Document>(this);

  @OneToMany(() => Control, (control) => control.appointment, {
    orphanRemoval: true,
  })
  controls = new Collection<Control>(this);
}
