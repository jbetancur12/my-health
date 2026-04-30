import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'executive_report_snapshots' })
export class ExecutiveReportSnapshot {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', unique: true })
  cacheKey!: string;

  @Property({ type: 'string' })
  contextFingerprint!: string;

  @Property({ type: 'text' })
  summary!: string;

  @Property({ type: 'string' })
  provider!: 'openai' | 'gemini';

  @Property({ type: 'string' })
  model!: string;

  @Property({ type: 'timestamptz' })
  generatedAt = new Date();

  @Property({ type: 'timestamptz' })
  lastUsedAt = new Date();

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt = new Date();
}
