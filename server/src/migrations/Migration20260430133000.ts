import { Migration } from '@mikro-orm/migrations';

export class Migration20260430133000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table if not exists "clinical_suggestions" ("id" uuid not null, "fingerprint" varchar(255) not null, "type" varchar(255) not null, "status" varchar(255) not null default \'pending\', "confidence" varchar(255) not null default \'medium\', "title" varchar(255) not null, "description" text not null, "source_document_id" varchar(255) not null, "source_appointment_id" varchar(255) not null, "related_document_ids" jsonb not null default \'[]\', "related_appointment_ids" jsonb not null default \'[]\', "payload" jsonb not null default \'{}\', "reviewed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "clinical_suggestions_pkey" primary key ("id"));'
    );
    this.addSql(
      'alter table "clinical_suggestions" add constraint "clinical_suggestions_fingerprint_unique" unique ("fingerprint");'
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "clinical_suggestions" cascade;');
  }
}
