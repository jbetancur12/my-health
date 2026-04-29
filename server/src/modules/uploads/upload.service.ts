import { createReadStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import { Document } from '../../entities/Document.js';
import { getOrm } from '../../orm.js';
import {
  buildDocumentDebugPath,
  buildDocumentObjectKey,
  extractContentType,
  getDocumentBucketName,
  getMinioObjectStream,
  statMinioObject,
  uploadBufferToMinio,
} from './minio-storage.js';

interface UploadDocumentFileInput {
  appointmentId: string;
  documentId: string;
  file: Express.Multer.File;
}

interface StoredDocumentFile {
  stream: Readable;
  contentType: string;
  contentLength?: number;
  fileName: string;
}

export async function uploadDocumentFile({ appointmentId, documentId, file }: UploadDocumentFileInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const document = await em.findOne(Document, { id: documentId }, { populate: ['appointment'] });

  if (!document || document.appointment.id !== appointmentId) {
    return null;
  }

  const bucket = getDocumentBucketName(document.type);
  const objectKey = buildDocumentObjectKey({
    specialty: document.appointment.specialty,
    doctor: document.appointment.doctor,
    appointmentId,
    documentId,
    appointmentDate: document.appointment.date,
    originalName: file.originalname,
  });

  await uploadBufferToMinio({
    bucket,
    objectKey,
    file,
  });

  document.storageBucket = bucket;
  document.storageKey = objectKey;
  document.filePath = buildDocumentDebugPath(bucket, objectKey);
  document.fileUrl = `/api/documents/${document.id}/file`;
  await em.flush();

  return { fileUrl: document.fileUrl };
}

export async function getStoredDocumentFile(documentId: string): Promise<StoredDocumentFile | null> {
  const orm = await getOrm();
  const em = orm.em.fork();
  const document = await em.findOne(Document, { id: documentId });

  if (!document) {
    return null;
  }

  if (document.storageBucket && document.storageKey) {
    const [stream, stat] = await Promise.all([
      getMinioObjectStream(document.storageBucket, document.storageKey),
      statMinioObject(document.storageBucket, document.storageKey),
    ]);

    return {
      stream,
      contentType: extractContentType(stat.metaData),
      contentLength: stat.size,
      fileName: document.name,
    };
  }

  if (document.filePath && !document.filePath.startsWith('minio://')) {
    try {
      await fs.access(document.filePath);
    } catch {
      return null;
    }

    return {
      stream: createReadStream(document.filePath),
      contentType: 'application/octet-stream',
      fileName: document.name,
    };
  }

  return null;
}
