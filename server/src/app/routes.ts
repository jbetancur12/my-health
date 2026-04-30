import express from 'express';
import multer from 'multer';
import { registerAppDataRoutes } from '../modules/app-data/routes.js';
import { registerAppointmentRoutes } from '../modules/appointments/routes.js';
import { registerClinicalMemoryRoutes } from '../modules/clinical-memory/routes.js';
import { registerClinicalSuggestionRoutes } from '../modules/clinical-suggestions/routes.js';
import { registerControlRoutes } from '../modules/controls/routes.js';
import { registerHealthRoutes } from '../modules/health/routes.js';
import { registerMedicalProfileRoutes } from '../modules/medical-profile/routes.js';
import { registerMedicationRoutes } from '../modules/medications/routes.js';
import { registerNotificationPreferenceRoutes } from '../modules/notification-preferences/routes.js';
import { registerReportRoutes } from '../modules/reports/routes.js';
import { registerScheduledAppointmentRoutes } from '../modules/scheduled-appointments/routes.js';
import { registerTagRoutes } from '../modules/tags/routes.js';
import { registerUploadRoutes } from '../modules/uploads/routes.js';
import { registerVaccineRoutes } from '../modules/vaccines/routes.js';
import { registerVitalSignRoutes } from '../modules/vital-signs/routes.js';

interface RegisterRoutesOptions {
  app: express.Express;
  nodeEnv: string;
  upload: multer.Multer;
  uploadsRoot: string;
}

export function registerRoutes({ app, nodeEnv, upload, uploadsRoot }: RegisterRoutesOptions) {
  void uploadsRoot;
  registerHealthRoutes(app, nodeEnv);
  registerAppointmentRoutes(app);
  registerClinicalMemoryRoutes(app);
  registerClinicalSuggestionRoutes(app);
  registerControlRoutes(app);
  registerUploadRoutes(app, upload);
  registerMedicationRoutes(app);
  registerMedicalProfileRoutes(app);
  registerNotificationPreferenceRoutes(app);
  registerReportRoutes(app);
  registerScheduledAppointmentRoutes(app);
  registerTagRoutes(app);
  registerVitalSignRoutes(app);
  registerVaccineRoutes(app);
  registerAppDataRoutes(app);
}
