import express from 'express';
import { getControls, postControl } from './control.controller.js';

export function registerControlRoutes(app: express.Express) {
  app.get('/api/controls', getControls);
  app.post('/api/controls', postControl);
}
