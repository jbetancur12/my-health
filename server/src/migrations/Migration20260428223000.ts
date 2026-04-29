import { Migration } from '@mikro-orm/migrations';

export class Migration20260428223000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "appointments" (
        "id" uuid not null,
        "date" timestamptz not null,
        "specialty" varchar(255) not null,
        "doctor" varchar(255) not null,
        "notes" text null,
        "created_at" timestamptz not null,
        "tags" jsonb null,
        constraint "appointments_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "controls" (
        "id" uuid not null,
        "date" timestamptz not null,
        "specialty" varchar(255) not null,
        "doctor" varchar(255) not null,
        "type" varchar(255) not null,
        "related_appointment_id" uuid not null,
        "created_at" timestamptz not null,
        "appointment_id" uuid not null,
        constraint "controls_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "documents" (
        "id" uuid not null,
        "type" varchar(255) check ("type" in ('historia_clinica', 'orden_procedimiento', 'orden_medicamento', 'orden_control', 'laboratorio')) not null,
        "name" varchar(255) not null,
        "date" timestamptz not null,
        "file_url" varchar(255) null,
        "file_path" varchar(255) null,
        "appointment_id" uuid not null,
        constraint "documents_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table if not exists "medications" (
        "id" uuid not null,
        "name" varchar(255) not null,
        "dosage" varchar(255) not null,
        "frequency" varchar(255) not null,
        "start_date" timestamptz not null,
        "end_date" timestamptz null,
        "notes" text null,
        "active" boolean not null default true,
        "created_at" timestamptz not null,
        constraint "medications_pkey" primary key ("id")
      );
    `);

    this.addSql('alter table if exists "appointments" add column if not exists "tags" jsonb null;');
    this.addSql('alter table if exists "appointments" add column if not exists "notes" text null;');

    this.addSql(`
      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'controls_appointment_id_foreign'
        ) then
          alter table "controls"
            add constraint "controls_appointment_id_foreign"
            foreign key ("appointment_id") references "appointments" ("id")
            on update cascade;
        end if;
      end
      $$;
    `);

    this.addSql(`
      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'documents_appointment_id_foreign'
        ) then
          alter table "documents"
            add constraint "documents_appointment_id_foreign"
            foreign key ("appointment_id") references "appointments" ("id")
            on update cascade;
        end if;
      end
      $$;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table if exists "documents" drop constraint if exists "documents_appointment_id_foreign";'
    );
    this.addSql(
      'alter table if exists "controls" drop constraint if exists "controls_appointment_id_foreign";'
    );
    this.addSql('drop table if exists "medications";');
    this.addSql('drop table if exists "documents";');
    this.addSql('drop table if exists "controls";');
    this.addSql('drop table if exists "appointments";');
  }
}
