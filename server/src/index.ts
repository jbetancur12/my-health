import 'dotenv/config';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app/create-app.js';
import { resumePendingDocumentSummaries } from './modules/uploads/document-summary.service.js';
import { warmMinioDocumentBuckets } from './modules/uploads/minio-storage.js';
import { startScheduledAppointmentReminderWorker } from './modules/scheduled-appointments/whatsapp-meta.service.js';
import { getOrm } from './orm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const uploadsRoot = path.join(projectRoot, 'uploads');

const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

async function bootstrap() {
  const orm = await getOrm();
  if (!isProduction) {
    await orm.getSchemaGenerator().ensureDatabase();
  }
  await orm.getMigrator().up();
  await fs.mkdir(uploadsRoot, { recursive: true });
  await warmMinioDocumentBuckets();
  await resumePendingDocumentSummaries();
  startScheduledAppointmentReminderWorker();

  const app = createApp({ clientOrigin, nodeEnv, uploadsRoot });
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
