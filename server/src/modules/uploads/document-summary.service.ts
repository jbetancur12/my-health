import { promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { Document, DocumentAiSummaryStatus } from '../../entities/Document.js';
import { getOrm } from '../../orm.js';
import {
  extractContentType,
  getMinioObjectStream,
  statMinioObject,
} from './minio-storage.js';
import { serializeAppointmentDocument } from './document.serializer.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_SUMMARY_MODEL = 'gpt-4.1-mini';
const DEFAULT_MAX_SUMMARY_FILE_BYTES = 12 * 1024 * 1024;
const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png']);
const activeSummaryJobs = new Set<string>();

function getOpenAiSummaryConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_SUMMARY_MODEL?.trim() || DEFAULT_OPENAI_SUMMARY_MODEL;
  const maxFileBytes = Number(process.env.OPENAI_SUMMARY_MAX_FILE_BYTES ?? DEFAULT_MAX_SUMMARY_FILE_BYTES);

  return {
    apiKey,
    model,
    maxFileBytes: Number.isFinite(maxFileBytes) ? maxFileBytes : DEFAULT_MAX_SUMMARY_FILE_BYTES,
  };
}

function isSupportedSummaryMimeType(contentType: string) {
  return contentType === 'application/pdf' || supportedImageMimeTypes.has(contentType);
}

function normalizeContentType(contentType: string, fileName: string) {
  const loweredName = fileName.toLowerCase();
  if (contentType === 'application/octet-stream' && loweredName.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (contentType === 'application/octet-stream' && loweredName.endsWith('.jpg')) {
    return 'image/jpeg';
  }

  return contentType;
}

function summarizeOpenAiError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return String(error).slice(0, 500);
}

function trimSummary(summary: string) {
  return summary
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function getDocumentBinary(document: Document) {
  if (document.storageBucket && document.storageKey) {
    const [stream, stat] = await Promise.all([
      getMinioObjectStream(document.storageBucket, document.storageKey),
      statMinioObject(document.storageBucket, document.storageKey),
    ]);

    return {
      buffer: await streamToBuffer(stream),
      contentType: normalizeContentType(extractContentType(stat.metaData), document.name),
    };
  }

  if (document.filePath && !document.filePath.startsWith('minio://')) {
    await fs.access(document.filePath);
    return {
      buffer: await fs.readFile(document.filePath),
      contentType: normalizeContentType(getContentTypeFromFilename(document.filePath), document.name),
    };
  }

  throw new Error('El documento no tiene un archivo disponible para resumir.');
}

function getContentTypeFromFilename(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  return 'application/octet-stream';
}

async function generateSummary(document: Document) {
  const config = getOpenAiSummaryConfig();
  if (!config) {
    throw new Error('OPENAI_API_KEY no está configurado.');
  }

  const { buffer, contentType } = await getDocumentBinary(document);

  if (buffer.length > config.maxFileBytes) {
    throw new Error(
      `El archivo supera el límite de ${Math.round(config.maxFileBytes / 1024 / 1024)} MB para resumirlo con IA.`
    );
  }

  if (!isSupportedSummaryMimeType(contentType)) {
    throw new Error('Por ahora solo podemos resumir PDFs, JPG y PNG.');
  }

  const base64 = buffer.toString('base64');
  const content =
    contentType === 'application/pdf'
      ? [
          {
            type: 'input_file',
            filename: document.name,
            file_data: `data:${contentType};base64,${base64}`,
          },
          {
            type: 'input_text',
            text:
              'Resume este documento médico en español. Devuelve solo texto plano, breve y útil para una persona que luego consultará su historial. Incluye: 1) motivo o tipo de documento, 2) hallazgos o indicaciones principales, 3) medicamentos, exámenes o controles mencionados si aparecen, 4) próximos pasos importantes. Si falta información, dilo con cautela. Máximo 8 líneas.',
          },
        ]
      : [
          {
            type: 'input_image',
            image_url: `data:${contentType};base64,${base64}`,
            detail: 'high',
          },
          {
            type: 'input_text',
            text:
              'Observa esta imagen de un documento médico y genera un resumen en español. Devuelve solo texto plano, breve y útil para consultar luego el historial. Incluye hallazgos, indicaciones, medicamentos, exámenes o próximos pasos si se alcanzan a leer. Si la imagen no permite verlo con claridad, dilo con cautela. Máximo 8 líneas.',
          },
        ];

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI respondió ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { output_text?: string };
  const summary = trimSummary(data.output_text ?? '');

  if (!summary) {
    throw new Error('La IA no devolvió un resumen utilizable para este documento.');
  }

  return summary;
}

async function processDocumentSummary(documentId: string) {
  if (activeSummaryJobs.has(documentId)) {
    return;
  }

  activeSummaryJobs.add(documentId);

  try {
    const orm = await getOrm();
    const em = orm.em.fork();
    const document = await em.findOne(Document, { id: documentId });

    if (!document || !document.fileUrl) {
      return;
    }

    document.aiSummaryStatus = DocumentAiSummaryStatus.PROCESSING;
    document.aiSummaryError = undefined;
    await em.flush();

    const summary = await generateSummary(document);
    document.aiSummary = summary;
    document.aiSummaryStatus = DocumentAiSummaryStatus.COMPLETED;
    document.aiSummaryError = undefined;
    document.aiSummaryUpdatedAt = new Date();
    await em.flush();
  } catch (error) {
    const orm = await getOrm();
    const em = orm.em.fork();
    const document = await em.findOne(Document, { id: documentId });

    if (document) {
      document.aiSummaryStatus = DocumentAiSummaryStatus.FAILED;
      document.aiSummaryError = summarizeOpenAiError(error);
      document.aiSummaryUpdatedAt = new Date();
      await em.flush();
    }
  } finally {
    activeSummaryJobs.delete(documentId);
  }
}

function startSummaryJob(documentId: string) {
  queueMicrotask(() => {
    void processDocumentSummary(documentId);
  });
}

export function isDocumentSummaryEnabled() {
  return getOpenAiSummaryConfig() !== null;
}

export async function queueDocumentSummary(documentId: string, force = false) {
  const config = getOpenAiSummaryConfig();
  const orm = await getOrm();
  const em = orm.em.fork();
  const document = await em.findOne(Document, { id: documentId });

  if (!document) {
    return null;
  }

  if (!config) {
    document.aiSummaryStatus = DocumentAiSummaryStatus.IDLE;
    document.aiSummaryError = undefined;
    await em.flush();
    return serializeAppointmentDocument(document);
  }

  if (
    !force &&
    (document.aiSummaryStatus === DocumentAiSummaryStatus.PENDING ||
      document.aiSummaryStatus === DocumentAiSummaryStatus.PROCESSING)
  ) {
    return serializeAppointmentDocument(document);
  }

  document.aiSummary = force ? undefined : document.aiSummary;
  document.aiSummaryStatus = DocumentAiSummaryStatus.PENDING;
  document.aiSummaryError = undefined;
  await em.flush();

  startSummaryJob(documentId);
  return serializeAppointmentDocument(document);
}

export async function resumePendingDocumentSummaries() {
  if (!isDocumentSummaryEnabled()) {
    return;
  }

  const orm = await getOrm();
  const em = orm.em.fork();
  const documents = await em.find(Document, {
    aiSummaryStatus: {
      $in: [DocumentAiSummaryStatus.PENDING, DocumentAiSummaryStatus.PROCESSING],
    },
  });

  documents.forEach((document) => {
    startSummaryJob(document.id);
  });
}
