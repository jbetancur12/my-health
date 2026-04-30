import { Migration } from '@mikro-orm/migrations';

export class Migration20260430103000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table "documents" add column if not exists "ai_summary_provider" varchar(255) null, add column if not exists "ai_summary_model" varchar(255) null, add column if not exists "ai_summary_last_action" varchar(255) null;'
    );
  }

  override async down(): Promise<void> {
    this.addSql('alter table "documents" drop column if exists "ai_summary_provider";');
    this.addSql('alter table "documents" drop column if exists "ai_summary_model";');
    this.addSql('alter table "documents" drop column if exists "ai_summary_last_action";');
  }
}
