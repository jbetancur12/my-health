import { Migration } from '@mikro-orm/migrations';

export class Migration20260429110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "documents" add column if not exists "storage_bucket" varchar(255) null;');
    this.addSql('alter table "documents" add column if not exists "storage_key" varchar(255) null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "documents" drop column if exists "storage_bucket";');
    this.addSql('alter table "documents" drop column if exists "storage_key";');
  }
}
