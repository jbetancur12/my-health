import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Appointment } from './entities/Appointment.js';
import { Control } from './entities/Control.js';
import { Document } from './entities/Document.js';
import { Medication } from './entities/Medication.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  clientUrl: databaseUrl,
  entities: [Appointment, Control, Document, Medication],
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
