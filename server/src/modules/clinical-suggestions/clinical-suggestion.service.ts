import { ClinicalSuggestion, ClinicalSuggestionConfidence, ClinicalSuggestionStatus, ClinicalSuggestionType } from '../../entities/ClinicalSuggestion.js';
import { Document } from '../../entities/Document.js';
import { MedicalProfile } from '../../entities/MedicalProfile.js';
import { Medication } from '../../entities/Medication.js';
import { getOrm } from '../../orm.js';
import { findFirst } from '../shared/find-first.js';
import { serializeClinicalSuggestion } from './clinical-suggestion.serializer.js';

interface SuggestionDraft {
  fingerprint: string;
  type: ClinicalSuggestionType;
  confidence: ClinicalSuggestionConfidence;
  title: string;
  description: string;
  sourceDocumentId: string;
  sourceAppointmentId: string;
  relatedDocumentIds: string[];
  relatedAppointmentIds: string[];
  payload: Record<string, unknown>;
}

function parseFollowUpDateFromInterval(interval: string | undefined, baseDate: Date) {
  if (!interval) {
    return undefined;
  }

  const normalized = normalizeKey(interval);
  const match = normalized.match(/(\d+)\s*(dia|dias|semana|semanas|mes|meses|ano|anos)/);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  const unit = match[2];
  const suggestedDate = new Date(baseDate);

  if (unit.startsWith('dia')) {
    suggestedDate.setDate(suggestedDate.getDate() + amount);
    return suggestedDate;
  }

  if (unit.startsWith('semana')) {
    suggestedDate.setDate(suggestedDate.getDate() + amount * 7);
    return suggestedDate;
  }

  if (unit.startsWith('mes')) {
    suggestedDate.setMonth(suggestedDate.getMonth() + amount);
    return suggestedDate;
  }

  suggestedDate.setFullYear(suggestedDate.getFullYear() + amount);
  return suggestedDate;
}

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSuggestionFingerprint(type: ClinicalSuggestionType, parts: string[]) {
  return [type, ...parts.map(normalizeKey)].join('::');
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function upsertDraft(map: Map<string, SuggestionDraft>, draft: SuggestionDraft) {
  const existing = map.get(draft.fingerprint);
  if (!existing) {
    map.set(draft.fingerprint, draft);
    return;
  }

  for (const documentId of draft.relatedDocumentIds) {
    pushUnique(existing.relatedDocumentIds, documentId);
  }

  for (const appointmentId of draft.relatedAppointmentIds) {
    pushUnique(existing.relatedAppointmentIds, appointmentId);
  }

  if (
    draft.confidence === ClinicalSuggestionConfidence.HIGH &&
    existing.confidence !== ClinicalSuggestionConfidence.HIGH
  ) {
    existing.confidence = draft.confidence;
  }
}

export async function listClinicalSuggestions() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const suggestions = await em.find(
    ClinicalSuggestion,
    {},
    {
      orderBy: {
        status: 'asc',
        updatedAt: 'desc',
      },
    }
  );

  return suggestions.map(serializeClinicalSuggestion);
}

export async function updateClinicalSuggestionStatus(
  id: string,
  status: ClinicalSuggestionStatus
) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const suggestion = await em.findOne(ClinicalSuggestion, { id });

  if (!suggestion) {
    return null;
  }

  suggestion.status = status;
  suggestion.reviewedAt = new Date();
  suggestion.updatedAt = new Date();
  await em.flush();

  return serializeClinicalSuggestion(suggestion);
}

export async function rebuildClinicalSuggestions() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const [documents, profile, medications, existingSuggestions] = await Promise.all([
    em.find(
      Document,
      {
        aiStructuredData: { $ne: null },
      },
      {
        populate: ['appointment'],
        orderBy: { date: 'asc' },
      }
    ),
    findFirst(em, MedicalProfile, { createdAt: 'asc' }) as Promise<MedicalProfile | null>,
    em.find(Medication, {}, { orderBy: { createdAt: 'desc' } }),
    em.find(ClinicalSuggestion, {}),
  ]);

  const knownConditions = new Set(
    (profile?.chronicConditions ?? []).map((condition) => normalizeKey(condition))
  );
  const activeMedications = new Set(
    medications.filter((medication) => medication.active).map((medication) => normalizeKey(medication.name))
  );
  const draftMap = new Map<string, SuggestionDraft>();

  for (const document of documents) {
    if (!document.aiStructuredData) {
      continue;
    }

    const baseSource = {
      sourceDocumentId: document.id,
      sourceAppointmentId: document.appointment.id,
      relatedDocumentIds: [document.id],
      relatedAppointmentIds: [document.appointment.id],
    };

    for (const condition of [
      ...document.aiStructuredData.detectedDiagnoses,
      ...document.aiStructuredData.detectedConditions,
    ]) {
      if (knownConditions.has(normalizeKey(condition))) {
        continue;
      }

      upsertDraft(draftMap, {
        fingerprint: buildSuggestionFingerprint(ClinicalSuggestionType.CONDITION, [condition]),
        type: ClinicalSuggestionType.CONDITION,
        confidence: ClinicalSuggestionConfidence.MEDIUM,
        title: 'Revisar patología detectada',
        description: `La IA detectó la condición "${condition}" y aún no aparece en el perfil médico estructurado.`,
        payload: { label: condition },
        ...baseSource,
      });
    }

    for (const medication of document.aiStructuredData.detectedMedications) {
      const isKnownMedication = activeMedications.has(normalizeKey(medication.name));

      if (medication.status === 'suspended' && isKnownMedication) {
        upsertDraft(draftMap, {
          fingerprint: buildSuggestionFingerprint(ClinicalSuggestionType.MEDICATION, [
            medication.name,
            'suspended',
          ]),
          type: ClinicalSuggestionType.MEDICATION,
          confidence: ClinicalSuggestionConfidence.HIGH,
          title: 'Revisar suspensión de medicamento',
          description: `El documento sugiere que "${medication.name}" podría estar suspendido o ya no seguir activo.`,
          payload: {
            action: 'review-suspension',
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            notes: medication.notes,
            status: medication.status,
          },
          ...baseSource,
        });
        continue;
      }

      if (!isKnownMedication && medication.status !== 'suspended') {
        upsertDraft(draftMap, {
          fingerprint: buildSuggestionFingerprint(ClinicalSuggestionType.MEDICATION, [
            medication.name,
            medication.dosage ?? '',
            medication.frequency ?? '',
          ]),
          type: ClinicalSuggestionType.MEDICATION,
          confidence:
            medication.status === 'active'
              ? ClinicalSuggestionConfidence.HIGH
              : ClinicalSuggestionConfidence.MEDIUM,
          title: 'Revisar medicamento detectado',
          description: `La IA encontró "${medication.name}" en el documento y todavía no aparece en el módulo de medicamentos activos.`,
          payload: {
            action: 'review-addition',
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            notes: medication.notes,
            status: medication.status,
          },
          ...baseSource,
        });
      }
    }

    for (const study of document.aiStructuredData.detectedPendingStudies) {
      upsertDraft(draftMap, {
        fingerprint: buildSuggestionFingerprint(ClinicalSuggestionType.PENDING_STUDY, [study]),
        type: ClinicalSuggestionType.PENDING_STUDY,
        confidence: ClinicalSuggestionConfidence.MEDIUM,
        title: 'Registrar estudio pendiente',
        description: `Se detectó un estudio pendiente: "${study}". Conviene revisarlo y decidir si debe quedar como pendiente operativo.`,
        payload: { label: study },
        ...baseSource,
      });
    }

    for (const control of document.aiStructuredData.detectedControls) {
      const suggestedDate = parseFollowUpDateFromInterval(control.interval, document.date);

      upsertDraft(draftMap, {
        fingerprint: buildSuggestionFingerprint(ClinicalSuggestionType.FOLLOW_UP, [
          control.description,
          control.interval ?? '',
          control.suggestedSpecialty ?? '',
        ]),
        type: ClinicalSuggestionType.FOLLOW_UP,
        confidence: ClinicalSuggestionConfidence.HIGH,
        title: 'Revisar control sugerido',
        description: `La IA encontró una recomendación de seguimiento: "${control.description}". Puedes revisarla antes de convertirla en una cita programada.`,
        payload: {
          description: control.description,
          interval: control.interval,
          suggestedSpecialty: control.suggestedSpecialty,
          suggestedDate: suggestedDate?.toISOString(),
          suggestedDoctor: document.appointment.doctor,
          sourceSpecialty: document.appointment.specialty,
        },
        ...baseSource,
      });
    }
  }

  const existingByFingerprint = new Map(
    existingSuggestions.map((suggestion) => [suggestion.fingerprint, suggestion])
  );
  const activeFingerprints = new Set(draftMap.keys());

  for (const draft of draftMap.values()) {
    const existing = existingByFingerprint.get(draft.fingerprint);

    if (!existing) {
      const created = new ClinicalSuggestion();
      created.id = crypto.randomUUID();
      created.fingerprint = draft.fingerprint;
      created.type = draft.type;
      created.status = ClinicalSuggestionStatus.PENDING;
      created.confidence = draft.confidence;
      created.title = draft.title;
      created.description = draft.description;
      created.sourceDocumentId = draft.sourceDocumentId;
      created.sourceAppointmentId = draft.sourceAppointmentId;
      created.relatedDocumentIds = draft.relatedDocumentIds;
      created.relatedAppointmentIds = draft.relatedAppointmentIds;
      created.payload = draft.payload;
      em.persist(created);
      continue;
    }

    existing.type = draft.type;
    existing.confidence = draft.confidence;
    existing.title = draft.title;
    existing.description = draft.description;
    existing.sourceDocumentId = draft.sourceDocumentId;
    existing.sourceAppointmentId = draft.sourceAppointmentId;
    existing.relatedDocumentIds = draft.relatedDocumentIds;
    existing.relatedAppointmentIds = draft.relatedAppointmentIds;
    existing.payload = draft.payload;
    existing.updatedAt = new Date();
  }

  for (const existing of existingSuggestions) {
    if (
      existing.status === ClinicalSuggestionStatus.PENDING &&
      !activeFingerprints.has(existing.fingerprint)
    ) {
      em.remove(existing);
    }
  }

  await em.flush();
}
