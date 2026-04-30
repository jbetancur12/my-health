import { Migration } from '@mikro-orm/migrations';

export class Migration20260430123000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table if not exists "clinical_memory" ("id" uuid not null, "active_conditions" jsonb not null default \'[]\', "historical_conditions" jsonb not null default \'[]\', "active_medications" jsonb not null default \'[]\', "important_findings" jsonb not null default \'[]\', "pending_studies" jsonb not null default \'[]\', "follow_up_recommendations" jsonb not null default \'[]\', "last_updated_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "clinical_memory_pkey" primary key ("id"));'
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "clinical_memory" cascade;');
  }
}
