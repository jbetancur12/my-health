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

function buildExecutiveContext(input: ExecutiveReportInput) {
  const appointments = [...input.appointments].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );
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

  const specialtyTimeline = [...specialtyMap.entries()].map(([specialty, meta]) => ({
    especialidad: specialty,
    citas: meta.count,
    ultimaFecha: meta.latestDate,
  }));

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

  return {
    periodo: input.dateRange,
    incluir: {
      perfil: input.includeProfile,
      citas: input.includeAppointments,
      medicamentos: input.includeMedications,
      vacunas: input.includeVaccines,
      signosVitales: input.includeVitals,
    },
    perfilMedico: input.includeProfile ? input.medicalProfile : undefined,
    citasRecientes: input.includeAppointments ? latestAppointments : [],
    especialidades: input.includeAppointments ? specialtyTimeline : [],
    medicamentosActivos: input.includeMedications
      ? input.medications.filter((medication) => medication.active).slice(0, 12)
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

  const prompt = buildExecutivePrompt(input);
  const summary =
    config.provider === 'openai'
      ? await generateOpenAiExecutiveSummary(config, prompt)
      : await generateGeminiExecutiveSummary(config, prompt);

  if (!summary) {
    throw new Error('La IA no devolvió un reporte ejecutivo utilizable.');
  }

  return {
    summary,
    generatedAt: new Date().toISOString(),
    provider: config.provider,
  };
}
