import express from 'express';
import { fetchClinicalMemory } from './clinical-memory.controller.js';

export function registerClinicalMemoryRoutes(app: express.Express) {
  app.get('/api/clinical-memory', fetchClinicalMemory);
}
