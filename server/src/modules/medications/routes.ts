import express from 'express';
import {
  getMedications,
  postMedication,
  putMedication,
  removeMedication,
} from './medication.controller.js';

export function registerMedicationRoutes(app: express.Express) {
  app.get('/api/medications', getMedications);
  app.post('/api/medications', postMedication);
  app.put('/api/medications/:id', putMedication);
  app.delete('/api/medications/:id', removeMedication);
}
