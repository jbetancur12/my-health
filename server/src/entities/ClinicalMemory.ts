import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export interface ClinicalMemoryFact {
  label: string;
  sourceDocumentIds: string[];
  sourceAppointmentIds: string[];
  lastSeenAt?: string;
}

export interface ClinicalMemoryMedicationFact extends ClinicalMemoryFact {
  dosage?: string;
  frequency?: string;
  notes?: string;
  status: 'active' | 'suspended' | 'mentioned';
}

export interface ClinicalMemoryFollowUpFact extends ClinicalMemoryFact {
  description: string;
  interval?: string;
  suggestedSpecialty?: string;
}

@Entity({ tableName: 'clinical_memory' })
export class ClinicalMemory {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'json' })
  activeConditions: ClinicalMemoryFact[] = [];

  @Property({ type: 'json' })
  historicalConditions: ClinicalMemoryFact[] = [];

  @Property({ type: 'json' })
  activeMedications: ClinicalMemoryMedicationFact[] = [];

  @Property({ type: 'json' })
  importantFindings: ClinicalMemoryFact[] = [];

  @Property({ type: 'json' })
  pendingStudies: ClinicalMemoryFact[] = [];

  @Property({ type: 'json' })
  followUpRecommendations: ClinicalMemoryFollowUpFact[] = [];

  @Property({ type: 'timestamptz' })
  lastUpdatedAt = new Date();

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt = new Date();
}
