import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

export enum ClinicalSuggestionType {
  MEDICATION = 'medication',
  CONDITION = 'condition',
  FOLLOW_UP = 'follow_up',
  PENDING_STUDY = 'pending_study',
}

export enum ClinicalSuggestionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
  POSTPONED = 'postponed',
}

export enum ClinicalSuggestionConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity({ tableName: 'clinical_suggestions' })
export class ClinicalSuggestion {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', unique: true })
  fingerprint!: string;

  @Enum(() => ClinicalSuggestionType)
  type!: ClinicalSuggestionType;

  @Enum(() => ClinicalSuggestionStatus)
  status: ClinicalSuggestionStatus = ClinicalSuggestionStatus.PENDING;

  @Enum(() => ClinicalSuggestionConfidence)
  confidence: ClinicalSuggestionConfidence = ClinicalSuggestionConfidence.MEDIUM;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'string' })
  sourceDocumentId!: string;

  @Property({ type: 'string' })
  sourceAppointmentId!: string;

  @Property({ type: 'json' })
  relatedDocumentIds: string[] = [];

  @Property({ type: 'json' })
  relatedAppointmentIds: string[] = [];

  @Property({ type: 'json' })
  payload: Record<string, unknown> = {};

  @Property({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt = new Date();
}
