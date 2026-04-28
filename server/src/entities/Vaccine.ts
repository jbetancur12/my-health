import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'vaccines' })
export class Vaccine {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'timestamptz' })
  date!: Date;

  @Property({ type: 'timestamptz', nullable: true })
  nextDose?: Date;

  @Property({ type: 'integer', nullable: true })
  doseNumber?: number;

  @Property({ type: 'integer', nullable: true })
  totalDoses?: number;

  @Property({ type: 'string', nullable: true })
  location?: string;

  @Property({ type: 'string', nullable: true })
  lot?: string;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();
}
