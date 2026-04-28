import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'vital_signs' })
export class VitalSign {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'timestamptz' })
  date!: Date;

  @Property({ type: 'integer', nullable: true })
  bloodPressureSystolic?: number;

  @Property({ type: 'integer', nullable: true })
  bloodPressureDiastolic?: number;

  @Property({ type: 'integer', nullable: true })
  heartRate?: number;

  @Property({ type: 'float', nullable: true })
  weight?: number;

  @Property({ type: 'integer', nullable: true })
  glucose?: number;

  @Property({ type: 'float', nullable: true })
  temperature?: number;

  @Property({ type: 'integer', nullable: true })
  oxygenSaturation?: number;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();
}
