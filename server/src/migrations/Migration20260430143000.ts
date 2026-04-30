import { Migration } from '@mikro-orm/migrations';

export class Migration20260430143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table if not exists "executive_report_snapshots" ("id" uuid not null, "cache_key" varchar(255) not null, "context_fingerprint" varchar(255) not null, "summary" text not null, "provider" varchar(255) not null, "model" varchar(255) not null, "generated_at" timestamptz not null, "last_used_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "executive_report_snapshots_pkey" primary key ("id"));'
    );
    this.addSql(
      'alter table "executive_report_snapshots" add constraint "executive_report_snapshots_cache_key_unique" unique ("cache_key");'
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "executive_report_snapshots" cascade;');
  }
}
