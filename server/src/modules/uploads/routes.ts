import express from 'express';
import multer from 'multer';
import {
  createDocumentFileController,
  createDocumentSummaryRetryController,
  createUploadController,
} from './upload.controller.js';

export function registerUploadRoutes(app: express.Express, upload: multer.Multer) {
  app.post('/api/upload', upload.single('file'), createUploadController());
  app.get('/api/documents/:documentId/file', createDocumentFileController());
  app.post('/api/documents/:documentId/summary/retry', createDocumentSummaryRetryController());
}
