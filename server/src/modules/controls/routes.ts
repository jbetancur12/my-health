import express from 'express';
import { getControls, postControl, putControl, removeControl } from './control.controller.js';

export function registerControlRoutes(app: express.Express) {
  app.get('/api/controls', getControls);
  app.post('/api/controls', postControl);
  app.put('/api/controls/:id', putControl);
  app.delete('/api/controls/:id', removeControl);
}
