import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

@Entity({ tableName: 'medical_profiles' })
export class MedicalProfile {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', nullable: true })
  bloodType?: string;

  @Property({ type: 'json' })
  allergies: string[] = [];

  @Property({ type: 'json' })
  chronicConditions: string[] = [];

  @Property({ type: 'json' })
  emergencyContacts: EmergencyContact[] = [];

  @Property({ type: 'json', nullable: true })
  insurance?: InsuranceInfo;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt = new Date();
}
