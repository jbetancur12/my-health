import { promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import {
  Document,
  DocumentAiSummaryAction,
  DocumentAiSummaryStatus,
} from '../../entities/Document.js';
import { getOrm } from '../../orm.js';
import {
  extractContentType,
  getMinioObjectStream,
  statMinioObject,
} from './minio-storage.js';
import { serializeAppointmentDocument } from './document.serializer.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_SUMMARY_MODEL = 'gpt-4.1-mini';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_SUMMARY_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_SUMMARY_FILE_BYTES = 12 * 1024 * 1024;
const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png']);
const activeSummaryJobs = new Set<string>();

type SummaryProvider = 'openai' | 'gemini';

interface SummaryConfig {
  provider: SummaryProvider;
  apiKey: string;
  model: string;
  maxFileBytes: number;
}

type SummaryTrigger = 'generated' | 'retried' | 'regenerated';

function getSummaryProviderPreference() {
  const provider = process.env.AI_SUMMARY_PROVIDER?.trim().toLowerCase();
  if (provider === 'openai' || provider === 'gemini' || provider === 'disabled') {
    return provider;
  }

  return undefined;
}

function getSharedSummaryMaxFileBytes() {
  const maxFileBytes = Number(process.env.AI_SUMMARY_MAX_FILE_BYTES ?? DEFAULT_MAX_SUMMARY_FILE_BYTES);
  return Number.isFinite(maxFileBytes) ? maxFileBytes : DEFAULT_MAX_SUMMARY_FILE_BYTES;
}

function getOpenAiSummaryConfig(): SummaryConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_SUMMARY_MODEL?.trim() || DEFAULT_OPENAI_SUMMARY_MODEL;
  return {
    provider: 'openai',
    apiKey,
    model,
    maxFileBytes: getSharedSummaryMaxFileBytes(),
  };
}

function getGeminiSummaryConfig(): SummaryConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    provider: 'gemini',
    apiKey,
    model: process.env.GEMINI_SUMMARY_MODEL?.trim() || DEFAULT_GEMINI_SUMMARY_MODEL,
    maxFileBytes: getSharedSummaryMaxFileBytes(),
  };
}

function getSummaryConfig(): SummaryConfig | null {
  const providerPreference = getSummaryProviderPreference();

  if (providerPreference === 'disabled') {
    return null;
  }

  if (providerPreference === 'openai') {
    return getOpenAiSummaryConfig();
  }

  if (providerPreference === 'gemini') {
    return getGeminiSummaryConfig();
  }

  return getOpenAiSummaryConfig() ?? getGeminiSummaryConfig();
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

function getSummaryPrompt(contentType: string) {
  if (contentType === 'application/pdf') {
    return 'Resume este documento médico en español. Devuelve solo texto plano, sin markdown, sin asteriscos y sin títulos decorativos. Usa una línea por ítem con este formato exacto cuando aplique: Documento: ..., Motivo: ..., Hallazgos: ..., Diagnóstico: ..., Tratamiento: ..., Exámenes: ..., Próximos pasos: ..., Estado: ... Si un dato no aparece, omítelo. Sé breve, claro y útil para consultar luego el historial.';
  }

  return 'Observa esta imagen de un documento médico y genera un resumen en español. Devuelve solo texto plano, sin markdown, sin asteriscos y sin títulos decorativos. Usa una línea por ítem con este formato exacto cuando aplique: Documento: ..., Motivo: ..., Hallazgos: ..., Diagnóstico: ..., Tratamiento: ..., Exámenes: ..., Próximos pasos: ..., Estado: ... Si algo no se alcanza a leer, dilo con cautela. Omite campos que no aparezcan.';
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
  const config = getSummaryConfig();
  if (!config) {
    throw new Error('No hay un proveedor de resumen IA configurado.');
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
  const summary =
    config.provider === 'openai'
      ? await generateOpenAiSummary({
          apiKey: config.apiKey,
          model: config.model,
          base64,
          contentType,
          fileName: document.name,
        })
      : await generateGeminiSummary({
          apiKey: config.apiKey,
          model: config.model,
          base64,
          contentType,
        });

  if (!summary) {
    throw new Error('La IA no devolvió un resumen utilizable para este documento.');
  }

  return {
    summary,
    provider: config.provider,
    model: config.model,
  };
}

async function generateOpenAiSummary(input: {
  apiKey: string;
  model: string;
  base64: string;
  contentType: string;
  fileName: string;
}) {
  const { apiKey, model, base64, contentType, fileName } = input;
  const content =
    contentType === 'application/pdf'
      ? [
          {
            type: 'input_file',
            filename: fileName,
            file_data: `data:${contentType};base64,${base64}`,
          },
          {
            type: 'input_text',
            text: getSummaryPrompt(contentType),
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
            text: getSummaryPrompt(contentType),
          },
        ];

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
  return trimSummary(data.output_text ?? '');
}

async function generateGeminiSummary(input: {
  apiKey: string;
  model: string;
  base64: string;
  contentType: string;
}) {
  const { apiKey, model, base64, contentType } = input;
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: contentType,
                  data: base64,
                },
              },
              {
                text: getSummaryPrompt(contentType),
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini respondió ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const summary = trimSummary(
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim())
      .filter((text): text is string => Boolean(text))
      .join('\n') ?? ''
  );

  return summary;
}

async function processDocumentSummary(documentId: string, trigger: SummaryTrigger) {
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

    const generated = await generateSummary(document);
    document.aiSummary = generated.summary;
    document.aiSummaryStatus = DocumentAiSummaryStatus.COMPLETED;
    document.aiSummaryError = undefined;
    document.aiSummaryUpdatedAt = new Date();
    document.aiSummaryProvider = generated.provider;
    document.aiSummaryModel = generated.model;
    document.aiSummaryLastAction =
      trigger === 'generated'
        ? DocumentAiSummaryAction.GENERATED
        : trigger === 'retried'
          ? DocumentAiSummaryAction.RETRIED
          : DocumentAiSummaryAction.REGENERATED;
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

function startSummaryJobForTrigger(documentId: string, trigger: SummaryTrigger) {
  queueMicrotask(() => {
    void processDocumentSummary(documentId, trigger);
  });
}

export function isDocumentSummaryEnabled() {
  return getSummaryConfig() !== null;
}

export function getDocumentSummaryConfigurationErrorMessage() {
  return 'AI summaries are not configured. Check AI_SUMMARY_PROVIDER and the matching API key.';
}

export async function queueDocumentSummary(documentId: string, force = false) {
  return queueDocumentSummaryByTrigger(documentId, force ? 'regenerated' : 'generated');
}

export async function queueDocumentSummaryByTrigger(
  documentId: string,
  trigger: SummaryTrigger
) {
  const config = getSummaryConfig();
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
    trigger === 'generated' &&
    (document.aiSummaryStatus === DocumentAiSummaryStatus.PENDING ||
      document.aiSummaryStatus === DocumentAiSummaryStatus.PROCESSING)
  ) {
    return serializeAppointmentDocument(document);
  }

  if (trigger === 'regenerated') {
    document.aiSummary = undefined;
  }
  document.aiSummaryStatus = DocumentAiSummaryStatus.PENDING;
  document.aiSummaryError = undefined;
  document.aiSummaryLastAction =
    trigger === 'generated'
      ? DocumentAiSummaryAction.GENERATED
      : trigger === 'retried'
        ? DocumentAiSummaryAction.RETRIED
        : DocumentAiSummaryAction.REGENERATED;
  await em.flush();

  startSummaryJobForTrigger(documentId, trigger);
  return serializeAppointmentDocument(document);
}

export async function generateDocumentSummary(documentId: string) {
  return queueDocumentSummaryByTrigger(documentId, 'generated');
}

export async function retryDocumentSummary(documentId: string) {
  return queueDocumentSummaryByTrigger(documentId, 'retried');
}

export async function regenerateDocumentSummary(documentId: string) {
  return queueDocumentSummaryByTrigger(documentId, 'regenerated');
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
    startSummaryJobForTrigger(
      document.id,
      document.aiSummaryLastAction === DocumentAiSummaryAction.REGENERATED
        ? 'regenerated'
        : document.aiSummaryLastAction === DocumentAiSummaryAction.RETRIED
          ? 'retried'
          : 'generated'
    );
  });
}
