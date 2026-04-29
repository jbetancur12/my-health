import type { NextFunction, Request, Response } from 'express';
import { getStoredDocumentFile, uploadDocumentFile } from './upload.service.js';
import { isMinioDocumentStorageConfigured } from './minio-storage.js';

export function createUploadController() {
  return async function postUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const appointmentId = String(req.body.appointmentId ?? '');
      const documentId = String(req.body.documentId ?? '');

      if (!file || !appointmentId || !documentId) {
        return res.status(400).json({ error: 'Missing required fields: file, appointmentId or documentId' });
      }

      if (!isMinioDocumentStorageConfigured()) {
        return res.status(503).json({
          error: 'MinIO storage is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY and MINIO_SECRET_KEY.',
        });
      }

      const result = await uploadDocumentFile({
        appointmentId,
        documentId,
        file,
      });

      if (!result) {
        return res.status(404).json({ error: 'Document not found for appointment' });
      }

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };
}

export function createDocumentFileController() {
  return async function getDocumentFile(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = String(req.params.documentId ?? '');
      const file = await getStoredDocumentFile(documentId);

      if (!file) {
        return res.status(404).json({ error: 'Document file not found' });
      }

      res.setHeader('Content-Type', file.contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="document"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`
      );

      if (file.contentLength !== undefined) {
        res.setHeader('Content-Length', String(file.contentLength));
      }

      file.stream.on('error', next);
      file.stream.pipe(res);
      return undefined;
    } catch (error) {
      return next(error);
    }
  };
}
