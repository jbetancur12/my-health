import { Migration } from '@mikro-orm/migrations';

export class Migration20260428235500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "medical_profiles" (
        "id" uuid not null,
        "blood_type" varchar(255) null,
        "allergies" jsonb not null,
        "chronic_conditions" jsonb not null,
        "emergency_contacts" jsonb not null,
        "insurance" jsonb null,
        "notes" text null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "medical_profiles_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "notification_preferences" (
        "id" uuid not null,
        "email" varchar(255) null,
        "phone" varchar(255) null,
        "email_enabled" boolean not null default false,
        "sms_enabled" boolean not null default false,
        "reminder_days" jsonb not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "notification_preferences_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "tag_definitions" (
        "id" uuid not null,
        "name" varchar(255) not null,
        "color" varchar(255) not null,
        "created_at" timestamptz not null,
        constraint "tag_definitions_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "vital_signs" (
        "id" uuid not null,
        "date" timestamptz not null,
        "blood_pressure_systolic" int null,
        "blood_pressure_diastolic" int null,
        "heart_rate" int null,
        "weight" real null,
        "glucose" int null,
        "temperature" real null,
        "oxygen_saturation" int null,
        "notes" text null,
        "created_at" timestamptz not null,
        constraint "vital_signs_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "vaccines" (
        "id" uuid not null,
        "name" varchar(255) not null,
        "date" timestamptz not null,
        "next_dose" timestamptz null,
        "dose_number" int null,
        "total_doses" int null,
        "location" varchar(255) null,
        "lot" varchar(255) null,
        "notes" text null,
        "created_at" timestamptz not null,
        constraint "vaccines_pkey" primary key ("id")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "vaccines";');
    this.addSql('drop table if exists "vital_signs";');
    this.addSql('drop table if exists "tag_definitions";');
    this.addSql('drop table if exists "notification_preferences";');
    this.addSql('drop table if exists "medical_profiles";');
  }
}
