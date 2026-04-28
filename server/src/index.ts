import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Appointment } from './entities/Appointment.js';
import { Control } from './entities/Control.js';
import { Document, DocumentType } from './entities/Document.js';
import { Medication } from './entities/Medication.js';
import { getOrm } from './orm.js';
import { serializeAppointment, serializeControl, serializeMedication } from './serializers.js';
import type { AppointmentInput, ControlInput, MedicationInput } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const uploadsRoot = path.join(projectRoot, 'uploads');

const app = express();
const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', async (_req, res, next) => {
  try {
    res.json({ status: 'ok', environment: nodeEnv });
  } catch (error) {
    next(error);
  }
});

app.get('/api/appointments', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const appointments = await em.find(
      Appointment,
      {},
      {
        populate: ['documents'],
        orderBy: { date: 'desc' },
      },
    );

    res.json({ appointments: appointments.map(serializeAppointment) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/appointments', async (req, res, next) => {
  try {
    const input = req.body as AppointmentInput;

    if (!input?.date || !input.specialty || !input.doctor || !Array.isArray(input.documents)) {
      return res.status(400).json({ error: 'Invalid appointment payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const appointment = new Appointment();
    appointment.id = crypto.randomUUID();
    appointment.date = new Date(input.date);
    appointment.specialty = input.specialty.trim();
    appointment.doctor = input.doctor.trim();
    appointment.notes = input.notes?.trim() || undefined;
    appointment.tags = input.tags?.filter(Boolean) ?? [];

    for (const item of input.documents) {
      const document = new Document();
      document.id = item.id || crypto.randomUUID();
      document.type = item.type as DocumentType;
      document.name = item.name?.trim() || 'Documento sin nombre';
      document.date = new Date(item.date);
      document.appointment = appointment;
      appointment.documents.add(document);
    }

    em.persist(appointment);
    await em.flush();
    await em.populate(appointment, ['documents']);

    res.status(201).json({ appointment: serializeAppointment(appointment) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/appointments/:id', async (req, res, next) => {
  try {
    const input = req.body as Partial<AppointmentInput>;
    const orm = await getOrm();
    const em = orm.em.fork();
    const appointment = await em.findOne(
      Appointment,
      { id: req.params.id },
      { populate: ['documents'] },
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (input.date) appointment.date = new Date(input.date);
    if (input.specialty) appointment.specialty = input.specialty.trim();
    if (input.doctor) appointment.doctor = input.doctor.trim();
    appointment.notes = input.notes?.trim() || undefined;
    appointment.tags = input.tags?.filter(Boolean) ?? [];

    if (Array.isArray(input.documents)) {
      const incomingIds = new Set(input.documents.map((document) => document.id));
      for (const document of appointment.documents.getItems()) {
        if (!incomingIds.has(document.id)) {
          em.remove(document);
        }
      }

      for (const item of input.documents) {
        const existing = appointment.documents.getItems().find((document) => document.id === item.id);
        if (existing) {
          existing.type = item.type as DocumentType;
          existing.name = item.name?.trim() || 'Documento sin nombre';
          existing.date = new Date(item.date);
        } else {
          const document = new Document();
          document.id = item.id || crypto.randomUUID();
          document.type = item.type as DocumentType;
          document.name = item.name?.trim() || 'Documento sin nombre';
          document.date = new Date(item.date);
          document.appointment = appointment;
          appointment.documents.add(document);
        }
      }
    }

    await em.flush();
    await em.populate(appointment, ['documents']);

    res.json({ appointment: serializeAppointment(appointment) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/controls', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const controls = await em.find(Control, {}, { orderBy: { date: 'asc' } });
    res.json({ controls: controls.map(serializeControl) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/controls', async (req, res, next) => {
  try {
    const input = req.body as ControlInput;

    if (!input?.date || !input.specialty || !input.doctor || !input.type || !input.relatedAppointmentId) {
      return res.status(400).json({ error: 'Invalid control payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const appointment = await em.findOne(Appointment, { id: input.relatedAppointmentId });

    if (!appointment) {
      return res.status(404).json({ error: 'Related appointment not found' });
    }

    const control = new Control();
    control.id = crypto.randomUUID();
    control.date = new Date(input.date);
    control.specialty = input.specialty.trim();
    control.doctor = input.doctor.trim();
    control.type = input.type.trim();
    control.relatedAppointmentId = appointment.id;
    control.appointment = appointment;

    em.persist(control);
    await em.flush();

    res.status(201).json({ control: serializeControl(control) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const appointmentId = String(req.body.appointmentId ?? '');
    const documentId = String(req.body.documentId ?? '');

    if (!file || !appointmentId || !documentId) {
      return res.status(400).json({ error: 'Missing required fields: file, appointmentId or documentId' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const document = await em.findOne(Document, { id: documentId }, { populate: ['appointment'] });

    if (!document || document.appointment.id !== appointmentId) {
      return res.status(404).json({ error: 'Document not found for appointment' });
    }

    const appointmentDir = path.join(uploadsRoot, appointmentId);
    await fs.mkdir(appointmentDir, { recursive: true });

    const extension = path.extname(file.originalname) || '';
    const filename = `${documentId}${extension}`;
    const filePath = path.join(appointmentDir, filename);
    await fs.writeFile(filePath, file.buffer);

    document.filePath = filePath;
    document.fileUrl = `/uploads/${appointmentId}/${filename}`;
    await em.flush();

    res.json({ fileUrl: document.fileUrl });
  } catch (error) {
    next(error);
  }
});

app.get('/api/medications', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const medications = await em.find(Medication, {}, { orderBy: { createdAt: 'desc' } });
    res.json({ medications: medications.map(serializeMedication) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/medications', async (req, res, next) => {
  try {
    const input = req.body as MedicationInput;
    if (!input?.name || !input.dosage || !input.frequency || !input.startDate) {
      return res.status(400).json({ error: 'Invalid medication payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const medication = new Medication();
    medication.id = crypto.randomUUID();
    medication.name = input.name.trim();
    medication.dosage = input.dosage.trim();
    medication.frequency = input.frequency.trim();
    medication.startDate = new Date(input.startDate);
    medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
    medication.notes = input.notes?.trim() || undefined;
    medication.active = Boolean(input.active);

    em.persist(medication);
    await em.flush();

    res.status(201).json({ medication: serializeMedication(medication) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/medications/:id', async (req, res, next) => {
  try {
    const input = req.body as Partial<MedicationInput>;
    const orm = await getOrm();
    const em = orm.em.fork();
    const medication = await em.findOne(Medication, { id: req.params.id });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    if (input.name) medication.name = input.name.trim();
    if (input.dosage) medication.dosage = input.dosage.trim();
    if (input.frequency) medication.frequency = input.frequency.trim();
    if (input.startDate) medication.startDate = new Date(input.startDate);
    medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
    medication.notes = input.notes?.trim() || undefined;
    if (typeof input.active === 'boolean') medication.active = input.active;

    await em.flush();
    res.json({ medication: serializeMedication(medication) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/medications/:id', async (req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const medication = await em.findOne(Medication, { id: req.params.id });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await em.removeAndFlush(medication);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: 'Internal server error',
    details: error instanceof Error ? error.message : String(error),
  });
});

async function bootstrap() {
  const orm = await getOrm();
  if (!isProduction) {
    await orm.getSchemaGenerator().ensureDatabase();
  }
  await orm.getMigrator().up();
  await fs.mkdir(uploadsRoot, { recursive: true });

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
