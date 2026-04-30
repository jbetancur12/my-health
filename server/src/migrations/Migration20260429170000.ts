import { Migration } from '@mikro-orm/migrations';

export class Migration20260429170000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table if not exists "scheduled_appointments" ("id" uuid not null, "scheduled_at" timestamptz not null, "specialty" varchar(255) not null, "doctor" varchar(255) not null, "location" varchar(255) null, "notes" text null, "expected_documents" jsonb not null default \'[]\', "status" varchar(255) not null default \'scheduled\', "reminder_sent_offsets" jsonb not null default \'[]\', "last_whatsapp_reminder_at" timestamptz null, "last_whatsapp_reminder_error" text null, "converted_appointment_id" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "scheduled_appointments_pkey" primary key ("id"));'
    );
    this.addSql(
      'alter table "notification_preferences" add column if not exists "whatsapp_enabled" boolean not null default false, add column if not exists "whatsapp_opt_in" boolean not null default false;'
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "scheduled_appointments" cascade;');
    this.addSql('alter table "notification_preferences" drop column if exists "whatsapp_enabled";');
    this.addSql('alter table "notification_preferences" drop column if exists "whatsapp_opt_in";');
  }
}
