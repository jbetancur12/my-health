import express from 'express';
import { getVaccines, postVaccine, removeVaccine } from './vaccine.controller.js';

export function registerVaccineRoutes(app: express.Express) {
  app.get('/api/vaccines', getVaccines);
  app.post('/api/vaccines', postVaccine);
  app.delete('/api/vaccines/:id', removeVaccine);
}
