import express from 'express';
import multer from 'multer';
import { createDocumentFileController, createUploadController } from './upload.controller.js';

export function registerUploadRoutes(app: express.Express, upload: multer.Multer) {
  app.post('/api/upload', upload.single('file'), createUploadController());
  app.get('/api/documents/:documentId/file', createDocumentFileController());
}
