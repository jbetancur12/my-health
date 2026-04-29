import { Client, type BucketItemStat } from 'minio';
import path from 'node:path';
import { DocumentType } from '../../entities/Document.js';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_BUCKET_PREFIX = 'citasmedicas';
interface MinioDocumentStorageConfig {
  endPoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region: string;
  bucketPrefix: string;
  enableVersioning: boolean;
}

interface UploadToMinioInput {
  bucket: string;
  objectKey: string;
  file: Express.Multer.File;
}

interface DocumentStoragePathInput {
  specialty: string;
  doctor: string;
  appointmentId: string;
  documentId: string;
  appointmentDate: Date;
  originalName: string;
}

const ensuredBuckets = new Set<string>();

const bucketSuffixByDocumentType: Record<DocumentType, string> = {
  [DocumentType.HISTORIA_CLINICA]: 'historias-clinicas',
  [DocumentType.ORDEN_PROCEDIMIENTO]: 'ordenes-procedimiento',
  [DocumentType.ORDEN_MEDICAMENTO]: 'ordenes-medicamento',
  [DocumentType.ORDEN_CONTROL]: 'ordenes-control',
  [DocumentType.LABORATORIO]: 'laboratorios',
};

let minioClient: Client | undefined;

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeBucketPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugifyPathSegment(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'sin-definir';
}

function sanitizeFilename(value: string) {
  const extension = path.extname(value).toLowerCase();
  const baseName = path.basename(value, extension);
  const safeBaseName = slugifyPathSegment(baseName);
  return `${safeBaseName}${extension}`;
}

function getMinioConfig(): MinioDocumentStorageConfig | null {
  const endPoint = process.env.MINIO_ENDPOINT?.trim();
  const accessKey = process.env.MINIO_ACCESS_KEY?.trim();
  const secretKey = process.env.MINIO_SECRET_KEY?.trim();

  if (!endPoint || !accessKey || !secretKey) {
    return null;
  }

  return {
    endPoint,
    port: process.env.MINIO_PORT ? parseInteger(process.env.MINIO_PORT, 9000) : undefined,
    useSSL: parseBoolean(process.env.MINIO_USE_SSL, false),
    accessKey,
    secretKey,
    region: process.env.MINIO_REGION?.trim() || DEFAULT_REGION,
    bucketPrefix: sanitizeBucketPart(process.env.MINIO_BUCKET_PREFIX?.trim() || DEFAULT_BUCKET_PREFIX),
    enableVersioning: parseBoolean(process.env.MINIO_ENABLE_VERSIONING, true),
  };
}

function getRequiredMinioConfig() {
  const config = getMinioConfig();

  if (!config) {
    throw new Error(
      'MinIO is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY and MINIO_SECRET_KEY to enable uploads.'
    );
  }

  return config;
}

function getClient() {
  if (!minioClient) {
    const config = getRequiredMinioConfig();
    minioClient = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });
  }

  return minioClient;
}

async function enableBucketVersioning(bucket: string) {
  const client = getClient();
  const versioningConfig = { Status: 'Enabled' as const };
  await client.setBucketVersioning(bucket, versioningConfig);
}

export function isMinioDocumentStorageConfigured() {
  return getMinioConfig() !== null;
}

export function getDocumentBucketName(documentType: DocumentType) {
  const config = getRequiredMinioConfig();
  return `${config.bucketPrefix}-${bucketSuffixByDocumentType[documentType]}`;
}

export function buildDocumentObjectKey({
  specialty,
  doctor,
  appointmentId,
  documentId,
  appointmentDate,
  originalName,
}: DocumentStoragePathInput) {
  const year = appointmentDate.getUTCFullYear();
  const specialtySegment = slugifyPathSegment(specialty);
  const doctorSegment = slugifyPathSegment(doctor);
  const filename = sanitizeFilename(originalName);

  return [
    specialtySegment,
    doctorSegment,
    String(year),
    appointmentId,
    `${documentId}-${filename}`,
  ].join('/');
}

export async function ensureDocumentBucketExists(bucket: string) {
  if (ensuredBuckets.has(bucket)) {
    return;
  }

  const config = getRequiredMinioConfig();
  const client = getClient();
  const exists = await client.bucketExists(bucket);

  if (!exists) {
    await client.makeBucket(bucket, config.region);
    if (config.enableVersioning) {
      await enableBucketVersioning(bucket);
    }
  }

  ensuredBuckets.add(bucket);
}

export async function warmMinioDocumentBuckets() {
  if (!isMinioDocumentStorageConfigured()) {
    return;
  }

  const config = getRequiredMinioConfig();
  const uniqueBuckets = new Set(
    Object.values(bucketSuffixByDocumentType).map((suffix) => `${config.bucketPrefix}-${suffix}`)
  );
  for (const bucket of uniqueBuckets) {
    await ensureDocumentBucketExists(bucket);
  }
}

export async function uploadBufferToMinio({ bucket, objectKey, file }: UploadToMinioInput) {
  await ensureDocumentBucketExists(bucket);

  const client = getClient();
  await client.putObject(bucket, objectKey, file.buffer, file.buffer.length, {
    'Content-Type': file.mimetype || 'application/octet-stream',
    'X-Amz-Meta-Original-File-Name': file.originalname,
  });
}

export async function getMinioObjectStream(bucket: string, objectKey: string) {
  const client = getClient();
  return client.getObject(bucket, objectKey);
}

export async function statMinioObject(bucket: string, objectKey: string): Promise<BucketItemStat> {
  const client = getClient();
  return client.statObject(bucket, objectKey);
}

export function extractContentType(metaData: BucketItemStat['metaData']) {
  const directValue = metaData['content-type'];
  const fallbackValue = metaData['Content-Type'];

  const contentType =
    (typeof directValue === 'string' && directValue) ||
    (typeof fallbackValue === 'string' && fallbackValue) ||
    'application/octet-stream';

  return contentType;
}

export function buildDocumentDebugPath(bucket: string, objectKey: string) {
  return `minio://${bucket}/${objectKey}`;
}
