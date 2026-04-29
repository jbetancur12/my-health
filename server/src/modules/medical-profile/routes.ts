import express from 'express';
import { fetchMedicalProfile, saveMedicalProfile } from './medical-profile.controller.js';

export function registerMedicalProfileRoutes(app: express.Express) {
  app.get('/api/medical-profile', fetchMedicalProfile);
  app.put('/api/medical-profile', saveMedicalProfile);
}
