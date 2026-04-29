import { Migration } from '@mikro-orm/migrations';

export class Migration20260429143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "alter table \"documents\" add column if not exists \"ai_summary\" text null, add column if not exists \"ai_summary_status\" varchar(255) not null default 'idle', add column if not exists \"ai_summary_error\" text null, add column if not exists \"ai_summary_updated_at\" timestamptz null;"
    );
  }

  override async down(): Promise<void> {
    this.addSql('alter table "documents" drop column if exists "ai_summary";');
    this.addSql('alter table "documents" drop column if exists "ai_summary_status";');
    this.addSql('alter table "documents" drop column if exists "ai_summary_error";');
    this.addSql('alter table "documents" drop column if exists "ai_summary_updated_at";');
  }
}
