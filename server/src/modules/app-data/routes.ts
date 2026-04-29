import express from 'express';
import { postAppDataImport } from './app-data.controller.js';

export function registerAppDataRoutes(app: express.Express) {
  app.post('/api/app-data/import', postAppDataImport);
}
