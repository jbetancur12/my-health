import express from 'express';
import { postExecutiveSummaryReport } from './report.controller.js';

export function registerReportRoutes(app: express.Express) {
  app.post('/api/reports/executive-summary', postExecutiveSummaryReport);
}
