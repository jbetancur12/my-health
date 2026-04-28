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
import { MedicalProfile } from './entities/MedicalProfile.js';
import { NotificationPreference } from './entities/NotificationPreference.js';
import { TagDefinition } from './entities/TagDefinition.js';
import { Vaccine } from './entities/Vaccine.js';
import { VitalSign } from './entities/VitalSign.js';
import { getOrm } from './orm.js';
import {
  serializeAppointment,
  serializeControl,
  serializeMedicalProfile,
  serializeMedication,
  serializeNotificationPreference,
  serializeTagDefinition,
  serializeVaccine,
  serializeVitalSign,
} from './serializers.js';
import type {
  AppDataImportInput,
  AppointmentInput,
  ControlInput,
  MedicalProfileInput,
  MedicationInput,
  NotificationPreferenceInput,
  TagDefinitionInput,
  VaccineInput,
  VitalSignInput,
} from './types.js';

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
    const appointment = createAppointmentEntity(input);

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
    const appointment = await em.findOne(Appointment, { id: req.params.id }, { populate: ['documents'] });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    updateAppointmentEntity(appointment, input, em);
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

    const control = createControlEntity(input, appointment.id);
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
    const medication = createMedicationEntity(input);

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

    updateMedicationEntity(medication, input);
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

app.get('/api/medical-profile', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const profile = (await findFirst(em, MedicalProfile, { createdAt: 'asc' })) as MedicalProfile | null;
    res.json({ medicalProfile: serializeMedicalProfile(profile) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/medical-profile', async (req, res, next) => {
  try {
    const input = req.body as MedicalProfileInput;
    const orm = await getOrm();
    const em = orm.em.fork();
    let profile = (await findFirst(em, MedicalProfile, { createdAt: 'asc' })) as MedicalProfile | null;

    if (!profile) {
      profile = new MedicalProfile();
      profile.id = crypto.randomUUID();
      em.persist(profile);
    }

    updateMedicalProfileEntity(profile, input);
    await em.flush();

    res.json({ medicalProfile: serializeMedicalProfile(profile) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/notification-preferences', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const preferences = (await findFirst(
      em,
      NotificationPreference,
      { createdAt: 'asc' },
    )) as NotificationPreference | null;
    res.json({ notificationPreferences: serializeNotificationPreference(preferences) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/notification-preferences', async (req, res, next) => {
  try {
    const input = req.body as NotificationPreferenceInput;
    const orm = await getOrm();
    const em = orm.em.fork();
    let preferences = (await findFirst(
      em,
      NotificationPreference,
      { createdAt: 'asc' },
    )) as NotificationPreference | null;

    if (!preferences) {
      preferences = new NotificationPreference();
      preferences.id = crypto.randomUUID();
      em.persist(preferences);
    }

    updateNotificationPreferenceEntity(preferences, input);
    await em.flush();

    res.json({ notificationPreferences: serializeNotificationPreference(preferences) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tags', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const tags = await em.find(TagDefinition, {}, { orderBy: { createdAt: 'asc' } });
    res.json({ tags: tags.map(serializeTagDefinition) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/tags', async (req, res, next) => {
  try {
    const input = req.body as TagDefinitionInput;
    if (!input?.name || !input.color) {
      return res.status(400).json({ error: 'Invalid tag payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const tag = new TagDefinition();
    tag.id = crypto.randomUUID();
    tag.name = input.name.trim();
    tag.color = input.color.trim();

    em.persist(tag);
    await em.flush();

    res.status(201).json({ tag: serializeTagDefinition(tag) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/vital-signs', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const vitalSigns = await em.find(VitalSign, {}, { orderBy: { date: 'desc' } });
    res.json({ vitalSigns: vitalSigns.map(serializeVitalSign) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/vital-signs', async (req, res, next) => {
  try {
    const input = req.body as VitalSignInput;
    if (!input?.date) {
      return res.status(400).json({ error: 'Invalid vital sign payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const vitalSign = createVitalSignEntity(input);

    em.persist(vitalSign);
    await em.flush();

    res.status(201).json({ vitalSign: serializeVitalSign(vitalSign) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/vital-signs/:id', async (req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const vitalSign = await em.findOne(VitalSign, { id: req.params.id });

    if (!vitalSign) {
      return res.status(404).json({ error: 'Vital sign not found' });
    }

    await em.removeAndFlush(vitalSign);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/vaccines', async (_req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const vaccines = await em.find(Vaccine, {}, { orderBy: { date: 'desc' } });
    res.json({ vaccines: vaccines.map(serializeVaccine) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/vaccines', async (req, res, next) => {
  try {
    const input = req.body as VaccineInput;
    if (!input?.name || !input.date) {
      return res.status(400).json({ error: 'Invalid vaccine payload' });
    }

    const orm = await getOrm();
    const em = orm.em.fork();
    const vaccine = createVaccineEntity(input);

    em.persist(vaccine);
    await em.flush();

    res.status(201).json({ vaccine: serializeVaccine(vaccine) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/vaccines/:id', async (req, res, next) => {
  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const vaccine = await em.findOne(Vaccine, { id: req.params.id });

    if (!vaccine) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }

    await em.removeAndFlush(vaccine);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/app-data/import', async (req, res, next) => {
  try {
    const input = req.body as AppDataImportInput;
    const orm = await getOrm();
    const em = orm.em.fork();

    await em.transactional(async (tx) => {
      await tx.nativeDelete(Control, {});
      await tx.nativeDelete(Document, {});
      await tx.nativeDelete(Appointment, {});
      await tx.nativeDelete(Medication, {});
      await tx.nativeDelete(VitalSign, {});
      await tx.nativeDelete(Vaccine, {});
      await tx.nativeDelete(TagDefinition, {});
      await tx.nativeDelete(MedicalProfile, {});
      await tx.nativeDelete(NotificationPreference, {});

      const appointments = (input.appointments ?? []).map((appointment) => createAppointmentEntity(appointment));
      const appointmentMap = new Map(appointments.map((appointment) => [appointment.id, appointment]));
      appointments.forEach((appointment) => tx.persist(appointment));

      for (const controlInput of input.controls ?? []) {
        const relatedAppointmentId = controlInput.relatedAppointmentId;
        const control = createControlEntity(controlInput, relatedAppointmentId);
        const appointment = appointmentMap.get(relatedAppointmentId);
        if (appointment) {
          control.appointment = appointment;
        }
        tx.persist(control);
      }

      for (const medicationInput of input.medications ?? []) {
        tx.persist(createMedicationEntity(medicationInput));
      }

      for (const tagInput of input.tags ?? []) {
        const maybeTagInput = tagInput as TagDefinitionInput & { id?: string };
        const tag = new TagDefinition();
        tag.id = maybeTagInput.id || crypto.randomUUID();
        tag.name = tagInput.name.trim();
        tag.color = tagInput.color.trim();
        tx.persist(tag);
      }

      if (input.medicalProfile) {
        const profile = new MedicalProfile();
        profile.id = crypto.randomUUID();
        updateMedicalProfileEntity(profile, input.medicalProfile);
        tx.persist(profile);
      }

      if (input.notificationPreferences) {
        const preferences = new NotificationPreference();
        preferences.id = crypto.randomUUID();
        updateNotificationPreferenceEntity(preferences, input.notificationPreferences);
        tx.persist(preferences);
      }

      for (const vitalSignInput of input.vitalSigns ?? []) {
        tx.persist(createVitalSignEntity(vitalSignInput));
      }

      for (const vaccineInput of input.vaccines ?? []) {
        tx.persist(createVaccineEntity(vaccineInput));
      }
    });

    const freshEm = orm.em.fork();
    const [
      appointments,
      controls,
      medications,
      tags,
      medicalProfile,
      notificationPreferences,
      vitalSigns,
      vaccines,
    ] = await Promise.all([
      freshEm.find(Appointment, {}, { populate: ['documents'], orderBy: { date: 'desc' } }),
      freshEm.find(Control, {}, { orderBy: { date: 'asc' } }),
      freshEm.find(Medication, {}, { orderBy: { createdAt: 'desc' } }),
      freshEm.find(TagDefinition, {}, { orderBy: { createdAt: 'asc' } }),
      findFirst(freshEm, MedicalProfile, { createdAt: 'asc' }) as Promise<MedicalProfile | null>,
      findFirst(freshEm, NotificationPreference, { createdAt: 'asc' }) as Promise<NotificationPreference | null>,
      freshEm.find(VitalSign, {}, { orderBy: { date: 'desc' } }),
      freshEm.find(Vaccine, {}, { orderBy: { date: 'desc' } }),
    ]);

    res.json({
      appointments: appointments.map(serializeAppointment),
      controls: controls.map(serializeControl),
      medications: medications.map(serializeMedication),
      tags: tags.map(serializeTagDefinition),
      medicalProfile: serializeMedicalProfile(medicalProfile),
      notificationPreferences: serializeNotificationPreference(notificationPreferences),
      vitalSigns: vitalSigns.map(serializeVitalSign),
      vaccines: vaccines.map(serializeVaccine),
    });
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

function createAppointmentEntity(input: AppointmentInput) {
  const maybeInput = input as AppointmentInput & { id?: string };
  const appointment = new Appointment();
  appointment.id = maybeInput.id || crypto.randomUUID();
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

  return appointment;
}

function updateAppointmentEntity(appointment: Appointment, input: Partial<AppointmentInput>, em: Awaited<ReturnType<typeof getOrm>>['em']) {
  if (input.date) appointment.date = new Date(input.date);
  if (input.specialty) appointment.specialty = input.specialty.trim();
  if (input.doctor) appointment.doctor = input.doctor.trim();
  appointment.notes = input.notes?.trim() || undefined;
  appointment.tags = input.tags?.filter(Boolean) ?? [];

  if (!Array.isArray(input.documents)) {
    return;
  }

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

function createControlEntity(input: ControlInput, relatedAppointmentId: string) {
  const maybeInput = input as ControlInput & { id?: string };
  const control = new Control();
  control.id = maybeInput.id || crypto.randomUUID();
  control.date = new Date(input.date);
  control.specialty = input.specialty.trim();
  control.doctor = input.doctor.trim();
  control.type = input.type.trim();
  control.relatedAppointmentId = relatedAppointmentId;
  return control;
}

function createMedicationEntity(input: MedicationInput) {
  const maybeInput = input as MedicationInput & { id?: string };
  const medication = new Medication();
  medication.id = maybeInput.id || crypto.randomUUID();
  medication.name = input.name.trim();
  medication.dosage = input.dosage.trim();
  medication.frequency = input.frequency.trim();
  medication.startDate = new Date(input.startDate);
  medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
  medication.notes = input.notes?.trim() || undefined;
  medication.active = Boolean(input.active);
  return medication;
}

function updateMedicationEntity(medication: Medication, input: Partial<MedicationInput>) {
  if (input.name) medication.name = input.name.trim();
  if (input.dosage) medication.dosage = input.dosage.trim();
  if (input.frequency) medication.frequency = input.frequency.trim();
  if (input.startDate) medication.startDate = new Date(input.startDate);
  medication.endDate = input.endDate ? new Date(input.endDate) : undefined;
  medication.notes = input.notes?.trim() || undefined;
  if (typeof input.active === 'boolean') medication.active = input.active;
}

function updateMedicalProfileEntity(profile: MedicalProfile, input: MedicalProfileInput) {
  profile.bloodType = input.bloodType?.trim() || undefined;
  profile.allergies = (input.allergies ?? []).map((item) => item.trim()).filter(Boolean);
  profile.chronicConditions = (input.chronicConditions ?? []).map((item) => item.trim()).filter(Boolean);
  profile.emergencyContacts = (input.emergencyContacts ?? [])
    .map((contact) => ({
      id: contact.id || crypto.randomUUID(),
      name: contact.name.trim(),
      relationship: contact.relationship.trim(),
      phone: contact.phone.trim(),
    }))
    .filter((contact) => contact.name && contact.phone);
  profile.insurance = input.insurance?.provider?.trim()
    ? {
        provider: input.insurance.provider.trim(),
        policyNumber: input.insurance.policyNumber.trim(),
        groupNumber: input.insurance.groupNumber?.trim() || undefined,
      }
    : undefined;
  profile.notes = input.notes?.trim() || undefined;
}

function updateNotificationPreferenceEntity(preferences: NotificationPreference, input: NotificationPreferenceInput) {
  preferences.email = input.email?.trim() || undefined;
  preferences.phone = input.phone?.trim() || undefined;
  preferences.emailEnabled = Boolean(input.emailEnabled);
  preferences.smsEnabled = Boolean(input.smsEnabled);
  preferences.reminderDays = (input.reminderDays ?? [7, 3, 1]).filter((day) => Number.isFinite(day));
}

function createVitalSignEntity(input: VitalSignInput) {
  const maybeInput = input as VitalSignInput & { id?: string };
  const vitalSign = new VitalSign();
  vitalSign.id = maybeInput.id || crypto.randomUUID();
  vitalSign.date = new Date(input.date);
  vitalSign.bloodPressureSystolic = toOptionalNumber(input.bloodPressureSystolic);
  vitalSign.bloodPressureDiastolic = toOptionalNumber(input.bloodPressureDiastolic);
  vitalSign.heartRate = toOptionalNumber(input.heartRate);
  vitalSign.weight = toOptionalNumber(input.weight);
  vitalSign.glucose = toOptionalNumber(input.glucose);
  vitalSign.temperature = toOptionalNumber(input.temperature);
  vitalSign.oxygenSaturation = toOptionalNumber(input.oxygenSaturation);
  vitalSign.notes = input.notes?.trim() || undefined;
  return vitalSign;
}

function createVaccineEntity(input: VaccineInput) {
  const maybeInput = input as VaccineInput & { id?: string };
  const vaccine = new Vaccine();
  vaccine.id = maybeInput.id || crypto.randomUUID();
  vaccine.name = input.name.trim();
  vaccine.date = new Date(input.date);
  vaccine.nextDose = input.nextDose ? new Date(input.nextDose) : undefined;
  vaccine.doseNumber = toOptionalNumber(input.doseNumber);
  vaccine.totalDoses = toOptionalNumber(input.totalDoses);
  vaccine.location = input.location?.trim() || undefined;
  vaccine.lot = input.lot?.trim() || undefined;
  vaccine.notes = input.notes?.trim() || undefined;
  return vaccine;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function findFirst<T extends object>(
  em: { find: (entityName: any, where: object, options?: object) => Promise<T[]> },
  entity: any,
  orderBy: object,
) {
  const [record] = await em.find(entity, {}, { limit: 1, orderBy });
  return record ?? null;
}

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
