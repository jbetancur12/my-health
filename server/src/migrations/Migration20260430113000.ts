import { Migration } from '@mikro-orm/migrations';

export class Migration20260430113000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "documents" add column if not exists "ai_structured_data" jsonb null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "documents" drop column if exists "ai_structured_data";');
  }
}
