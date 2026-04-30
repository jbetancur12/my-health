import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Appointment } from './entities/Appointment.js';
import { ClinicalMemory } from './entities/ClinicalMemory.js';
import { ClinicalSuggestion } from './entities/ClinicalSuggestion.js';
import { Control } from './entities/Control.js';
import { Document } from './entities/Document.js';
import { ExecutiveReportSnapshot } from './entities/ExecutiveReportSnapshot.js';
import { Medication } from './entities/Medication.js';
import { MedicalProfile } from './entities/MedicalProfile.js';
import { NotificationPreference } from './entities/NotificationPreference.js';
import { ScheduledAppointment } from './entities/ScheduledAppointment.js';
import { TagDefinition } from './entities/TagDefinition.js';
import { Vaccine } from './entities/Vaccine.js';
import { VitalSign } from './entities/VitalSign.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  clientUrl: databaseUrl,
  entities: [
    Appointment,
    ClinicalMemory,
    ClinicalSuggestion,
    Control,
    Document,
    ExecutiveReportSnapshot,
    Medication,
    MedicalProfile,
    NotificationPreference,
    ScheduledAppointment,
    TagDefinition,
    Vaccine,
    VitalSign,
  ],
  debug: process.env.NODE_ENV !== 'production',
  extensions: [Migrator],
  migrations: {
    path: path.join(__dirname, 'migrations'),
    pathTs: path.join(__dirname, 'migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    allOrNothing: true,
  },
});
