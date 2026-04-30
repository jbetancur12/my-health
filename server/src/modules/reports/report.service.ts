import crypto from 'node:crypto';
import { ExecutiveReportSnapshot } from '../../entities/ExecutiveReportSnapshot.js';
import { getOrm } from '../../orm.js';
import type { ExecutiveReportInput, ExecutiveReportOutput } from './report.types.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_SUMMARY_MODEL = 'gpt-4.1-mini';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_SUMMARY_MODEL = 'gemini-2.5-flash';

type ReportProvider = 'openai' | 'gemini';

interface ReportConfig {
  provider: ReportProvider;
  apiKey: string;
  model: string;
}

function getReportProviderPreference() {
  const provider = process.env.AI_SUMMARY_PROVIDER?.trim().toLowerCase();
  if (provider === 'openai' || provider === 'gemini' || provider === 'disabled') {
    return provider;
  }

  return undefined;
}

function getOpenAiReportConfig(): ReportConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    provider: 'openai',
    apiKey,
    model: process.env.OPENAI_SUMMARY_MODEL?.trim() || DEFAULT_OPENAI_SUMMARY_MODEL,
  };
}

function getGeminiReportConfig(): ReportConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    provider: 'gemini',
    apiKey,
    model: process.env.GEMINI_SUMMARY_MODEL?.trim() || DEFAULT_GEMINI_SUMMARY_MODEL,
  };
}

function getReportConfig(): ReportConfig | null {
  const providerPreference = getReportProviderPreference();

  if (providerPreference === 'disabled') {
    return null;
  }

  if (providerPreference === 'openai') {
    return getOpenAiReportConfig();
  }

  if (providerPreference === 'gemini') {
    return getGeminiReportConfig();
  }

  return getOpenAiReportConfig() ?? getGeminiReportConfig();
}

function trimSummary(summary: string) {
  return summary
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function filterAppointmentsByRange(input: ExecutiveReportInput) {
  const sortedAppointments = [...input.appointments].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );

  if (input.dateRange === 'all') {
    return sortedAppointments;
  }

  const cutoff = new Date();
  if (input.dateRange === '6months') {
    cutoff.setMonth(cutoff.getMonth() - 6);
  } else {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  }

  return sortedAppointments.filter(
    (appointment) => new Date(appointment.date).getTime() >= cutoff.getTime()
  );
}

function buildExecutiveContext(input: ExecutiveReportInput) {
  const appointments = filterAppointmentsByRange(input);
  const latestAppointments = appointments.slice(0, 8).map((appointment) => ({
    fecha: appointment.date,
    especialidad: appointment.specialty,
    medico: appointment.doctor,
    notas: appointment.notes,
    tags: appointment.tags ?? [],
    resumenesDocumentos: appointment.documents
      .filter((document) => document.aiSummary)
      .slice(0, 3)
      .map((document) => ({
        tipo: document.type,
        nombre: document.name,
        resumen: document.aiSummary,
      })),
  }));

  const specialtyMap = new Map<string, { count: number; latestDate: string }>();
  for (const appointment of appointments) {
    const current = specialtyMap.get(appointment.specialty);
    if (!current) {
      specialtyMap.set(appointment.specialty, { count: 1, latestDate: appointment.date });
      continue;
    }

    current.count += 1;
    if (new Date(appointment.date).getTime() > new Date(current.latestDate).getTime()) {
      current.latestDate = appointment.date;
    }
  }

  const specialtyTimeline = [...specialtyMap.entries()]
    .map(([specialty, meta]) => ({
      especialidad: specialty,
      citas: meta.count,
      ultimaFecha: meta.latestDate,
    }))
    .sort((left, right) => left.especialidad.localeCompare(right.especialidad, 'es'));

  const labAndHistoryHighlights = appointments
    .flatMap((appointment) =>
      appointment.documents
        .filter((document) => document.aiSummary)
        .map((document) => ({
          fecha: appointment.date,
          especialidad: appointment.specialty,
          medico: appointment.doctor,
          tipo: document.type,
          nombre: document.name,
          resumen: document.aiSummary,
        }))
    )
    .slice(0, 10);

  const longitudinalMemory = input.clinicalMemory
    ? {
        condicionesActivas: input.clinicalMemory.activeConditions
          .map((fact) => fact.label)
          .sort((left, right) => left.localeCompare(right, 'es')),
        condicionesHistoricas: input.clinicalMemory.historicalConditions
          .map((fact) => fact.label)
          .sort((left, right) => left.localeCompare(right, 'es')),
        medicamentosActivos: input.clinicalMemory.activeMedications
          .map((fact) => ({
            nombre: fact.label,
            dosis: fact.dosage,
            frecuencia: fact.frequency,
            notas: fact.notes,
            estado: fact.status,
          }))
          .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es')),
        hallazgosImportantes: input.clinicalMemory.importantFindings
          .map((fact) => fact.label)
          .sort((left, right) => left.localeCompare(right, 'es')),
        estudiosPendientes: input.clinicalMemory.pendingStudies
          .map((fact) => fact.label)
          .sort((left, right) => left.localeCompare(right, 'es')),
        controlesSugeridos: input.clinicalMemory.followUpRecommendations
          .map((fact) => ({
            descripcion: fact.description,
            intervalo: fact.interval,
            especialidad: fact.suggestedSpecialty,
          }))
          .sort((left, right) => left.descripcion.localeCompare(right.descripcion, 'es')),
        ultimaActualizacion: input.clinicalMemory.lastUpdatedAt,
      }
    : undefined;

  return {
    periodo: input.dateRange,
    incluir: {
      perfil: input.includeProfile,
      citas: input.includeAppointments,
      medicamentos: input.includeMedications,
      vacunas: input.includeVaccines,
      signosVitales: input.includeVitals,
      memoriaClinica: Boolean(input.clinicalMemory),
    },
    perfilMedico: input.includeProfile ? input.medicalProfile : undefined,
    memoriaClinicaLongitudinal: longitudinalMemory,
    citasRecientes: input.includeAppointments ? latestAppointments : [],
    especialidades: input.includeAppointments ? specialtyTimeline : [],
    medicamentosActivos: input.includeMedications
      ? input.medications
          .filter((medication) => medication.active)
          .slice(0, 12)
          .sort((left, right) => left.name.localeCompare(right.name, 'es'))
      : [],
    vacunasRecientes: input.includeVaccines
      ? [...input.vaccines]
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
          .slice(0, 10)
      : [],
    signosVitalesRecientes: input.includeVitals
      ? [...input.vitalSigns]
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
          .slice(0, 10)
      : [],
    hallazgosDocumentales: input.includeAppointments ? labAndHistoryHighlights : [],
  };
}

function buildExecutivePrompt(input: ExecutiveReportInput) {
  const context = buildExecutiveContext(input);

  return [
    'Genera un reporte ejecutivo médico en español para acompañar un PDF clínico personal.',
    'Usa solo la información entregada. No inventes diagnósticos, fechas ni tratamientos.',
    'Prioriza la memoria clínica longitudinal como fuente estable y usa los eventos recientes solo para cambios o evolución.',
    'Evita repetir patologías o medicamentos ya consolidados si no hay novedad clínica.',
    'Devuelve solo texto plano, sin markdown, sin asteriscos, sin tablas y sin frases introductorias.',
    'Usa exactamente estos encabezados, cada uno en su propia línea:',
    'Resumen general',
    'Evolución reciente',
    'Hallazgos por especialidad',
    'Estudios, laboratorios e historiales',
    'Tratamientos actuales',
    'Próximos pasos y alertas',
    'Debajo de cada encabezado usa entre 1 y 4 líneas que empiecen con "- ".',
    'Si una sección no aplica, escribe una sola línea "- Sin datos relevantes".',
    'Sé clínicamente útil, breve y orientado a continuidad de atención.',
    '',
    'Contexto clínico estructurado:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function buildContextFingerprint(input: ExecutiveReportInput) {
  const context = buildExecutiveContext(input);
  return crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex');
}

function buildCacheKey(input: ExecutiveReportInput, provider: ReportProvider) {
  const flags = {
    dateRange: input.dateRange,
    includeProfile: input.includeProfile,
    includeAppointments: input.includeAppointments,
    includeMedications: input.includeMedications,
    includeVaccines: input.includeVaccines,
    includeVitals: input.includeVitals,
    provider,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(flags))
    .digest('hex');
}

async function generateOpenAiExecutiveSummary(config: ReportConfig, prompt: string) {
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
          content: [{ type: 'input_text', text: prompt }],
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

async function generateGeminiExecutiveSummary(config: ReportConfig, prompt: string) {
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
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

  return trimSummary(
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim())
      .filter((text): text is string => Boolean(text))
      .join('\n') ?? ''
  );
}

export async function generateExecutiveReport(
  input: ExecutiveReportInput
): Promise<ExecutiveReportOutput> {
  const config = getReportConfig();

  if (!config) {
    throw Object.assign(
      new Error(
        'Los reportes ejecutivos con IA no están configurados. Revisa AI_SUMMARY_PROVIDER y la API key correspondiente.'
      ),
      { statusCode: 503 }
    );
  }

  const cacheKey = buildCacheKey(input, config.provider);
  const contextFingerprint = buildContextFingerprint(input);
  const orm = await getOrm();
  const em = orm.em.fork();
  const existingSnapshot = await em.findOne(ExecutiveReportSnapshot, { cacheKey });

  if (existingSnapshot && existingSnapshot.contextFingerprint === contextFingerprint) {
    existingSnapshot.lastUsedAt = new Date();
    existingSnapshot.updatedAt = new Date();
    await em.flush();

    return {
      summary: existingSnapshot.summary,
      generatedAt: existingSnapshot.generatedAt.toISOString(),
      provider: existingSnapshot.provider,
      model: existingSnapshot.model,
      cached: true,
    };
  }

  const prompt = buildExecutivePrompt(input);
  const summary =
    config.provider === 'openai'
      ? await generateOpenAiExecutiveSummary(config, prompt)
      : await generateGeminiExecutiveSummary(config, prompt);

  if (!summary) {
    throw new Error('La IA no devolvió un reporte ejecutivo utilizable.');
  }

  const snapshot = existingSnapshot ?? new ExecutiveReportSnapshot();
  if (!existingSnapshot) {
    snapshot.id = crypto.randomUUID();
    snapshot.cacheKey = cacheKey;
    snapshot.createdAt = new Date();
  }

  snapshot.contextFingerprint = contextFingerprint;
  snapshot.summary = summary;
  snapshot.provider = config.provider;
  snapshot.model = config.model;
  snapshot.generatedAt = new Date();
  snapshot.lastUsedAt = new Date();
  snapshot.updatedAt = new Date();
  em.persist(snapshot);
  await em.flush();

  return {
    summary,
    generatedAt: snapshot.generatedAt.toISOString(),
    provider: config.provider,
    model: config.model,
    cached: false,
  };
}
