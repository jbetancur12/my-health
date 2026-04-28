import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'medications' })
export class Medication {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  dosage!: string;

  @Property({ type: 'string' })
  frequency!: string;

  @Property({ type: 'timestamptz' })
  startDate!: Date;

  @Property({ type: 'timestamptz', nullable: true })
  endDate?: Date;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'boolean' })
  active = true;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();
}
