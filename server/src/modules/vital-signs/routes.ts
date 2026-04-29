import express from 'express';
import { getVitalSigns, postVitalSign, removeVitalSign } from './vital-sign.controller.js';

export function registerVitalSignRoutes(app: express.Express) {
  app.get('/api/vital-signs', getVitalSigns);
  app.post('/api/vital-signs', postVitalSign);
  app.delete('/api/vital-signs/:id', removeVitalSign);
}
