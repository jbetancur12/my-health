import { ClinicalMemory } from '../../entities/ClinicalMemory.js';
import { Document } from '../../entities/Document.js';
import { MedicalProfile } from '../../entities/MedicalProfile.js';
import { getOrm } from '../../orm.js';
import { findFirst } from '../shared/find-first.js';
import { serializeClinicalMemory } from './clinical-memory.serializer.js';
import type {
  ClinicalMemoryFact,
  ClinicalMemoryFollowUpFact,
  ClinicalMemoryMedicationFact,
} from '../../entities/ClinicalMemory.js';

const ACTIVE_LOOKBACK_MONTHS = 18;

interface AggregateContext {
  sourceDocumentId: string;
  sourceAppointmentId: string;
  observedAt?: string;
}

function getActiveCutoffDate() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - ACTIVE_LOOKBACK_MONTHS);
  return cutoff;
}

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function registerSource<T extends ClinicalMemoryFact>(entry: T, context: AggregateContext) {
  if (!entry.sourceDocumentIds.includes(context.sourceDocumentId)) {
    entry.sourceDocumentIds.push(context.sourceDocumentId);
  }

  if (!entry.sourceAppointmentIds.includes(context.sourceAppointmentId)) {
    entry.sourceAppointmentIds.push(context.sourceAppointmentId);
  }

  if (!context.observedAt) {
    return;
  }

  if (!entry.lastSeenAt || new Date(context.observedAt) > new Date(entry.lastSeenAt)) {
    entry.lastSeenAt = context.observedAt;
  }
}

function pushFact(
  map: Map<string, ClinicalMemoryFact>,
  label: string,
  context: AggregateContext
) {
  const normalizedLabel = label.trim();
  if (!normalizedLabel) {
    return;
  }

  const key = normalizeKey(normalizedLabel);
  const existing = map.get(key);
  if (existing) {
    registerSource(existing, context);
    return;
  }

  const created: ClinicalMemoryFact = {
    label: normalizedLabel,
    sourceDocumentIds: [],
    sourceAppointmentIds: [],
    lastSeenAt: context.observedAt,
  };
  registerSource(created, context);
  map.set(key, created);
}

function extractFindingLines(summary?: string) {
  if (!summary) {
    return [];
  }

  const findings: string[] = [];
  for (const rawLine of summary.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const normalized = line.toLowerCase();
    if (
      normalized.startsWith('hallazgos:') ||
      normalized.startsWith('estado:') ||
      normalized.startsWith('motivo:')
    ) {
      findings.push(line);
    }
  }

  return findings;
}

function sortFacts<T extends ClinicalMemoryFact>(facts: T[]) {
  return facts.sort((left, right) => {
    const leftSeen = left.lastSeenAt ? new Date(left.lastSeenAt).getTime() : 0;
    const rightSeen = right.lastSeenAt ? new Date(right.lastSeenAt).getTime() : 0;
    if (rightSeen !== leftSeen) {
      return rightSeen - leftSeen;
    }

    return left.label.localeCompare(right.label, 'es');
  });
}

function sortFollowUps(facts: ClinicalMemoryFollowUpFact[]) {
  return facts.sort((left, right) => {
    const leftSeen = left.lastSeenAt ? new Date(left.lastSeenAt).getTime() : 0;
    const rightSeen = right.lastSeenAt ? new Date(right.lastSeenAt).getTime() : 0;
    if (rightSeen !== leftSeen) {
      return rightSeen - leftSeen;
    }

    return left.description.localeCompare(right.description, 'es');
  });
}

function sortMedications(facts: ClinicalMemoryMedicationFact[]) {
  return facts.sort((left, right) => {
    const leftSeen = left.lastSeenAt ? new Date(left.lastSeenAt).getTime() : 0;
    const rightSeen = right.lastSeenAt ? new Date(right.lastSeenAt).getTime() : 0;
    if (rightSeen !== leftSeen) {
      return rightSeen - leftSeen;
    }

    return left.label.localeCompare(right.label, 'es');
  });
}

export async function getClinicalMemory() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const memory = (await findFirst(em, ClinicalMemory, {
    createdAt: 'asc',
  })) as ClinicalMemory | null;

  return serializeClinicalMemory(memory);
}

export async function rebuildClinicalMemory() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const [documents, profile] = await Promise.all([
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
  ]);

  let memory = (await findFirst(em, ClinicalMemory, {
    createdAt: 'asc',
  })) as ClinicalMemory | null;

  if (!memory) {
    memory = new ClinicalMemory();
    memory.id = crypto.randomUUID();
    em.persist(memory);
  }

  const activeConditionMap = new Map<string, ClinicalMemoryFact>();
  const historicalConditionMap = new Map<string, ClinicalMemoryFact>();
  const pendingStudyMap = new Map<string, ClinicalMemoryFact>();
  const findingMap = new Map<string, ClinicalMemoryFact>();
  const followUpMap = new Map<string, ClinicalMemoryFollowUpFact>();
  const medicationMap = new Map<string, ClinicalMemoryMedicationFact>();
  const cutoffDate = getActiveCutoffDate();

  for (const chronicCondition of profile?.chronicConditions ?? []) {
    pushFact(activeConditionMap, chronicCondition, {
      sourceDocumentId: 'medical-profile',
      sourceAppointmentId: 'medical-profile',
      observedAt: profile?.updatedAt?.toISOString(),
    });
  }

  for (const document of documents) {
    if (!document.aiStructuredData) {
      continue;
    }

    const observedAt = document.date.toISOString();
    const context: AggregateContext = {
      sourceDocumentId: document.id,
      sourceAppointmentId: document.appointment.id,
      observedAt,
    };

    const conditionTarget =
      document.date >= cutoffDate ? activeConditionMap : historicalConditionMap;

    for (const diagnosis of document.aiStructuredData.detectedDiagnoses) {
      pushFact(conditionTarget, diagnosis, context);
    }

    for (const condition of document.aiStructuredData.detectedConditions) {
      pushFact(conditionTarget, condition, context);
    }

    for (const study of document.aiStructuredData.detectedPendingStudies) {
      pushFact(pendingStudyMap, study, context);
    }

    for (const finding of extractFindingLines(document.aiSummary)) {
      pushFact(findingMap, finding, context);
    }

    for (const control of document.aiStructuredData.detectedControls) {
      const key = normalizeKey(
        `${control.description}|${control.interval ?? ''}|${control.suggestedSpecialty ?? ''}`
      );
      const existing = followUpMap.get(key);

      if (existing) {
        registerSource(existing, context);
        continue;
      }

      const created: ClinicalMemoryFollowUpFact = {
        label: control.description,
        description: control.description,
        interval: control.interval,
        suggestedSpecialty: control.suggestedSpecialty,
        sourceDocumentIds: [],
        sourceAppointmentIds: [],
        lastSeenAt: observedAt,
      };
      registerSource(created, context);
      followUpMap.set(key, created);
    }

    for (const medication of document.aiStructuredData.detectedMedications) {
      const key = normalizeKey(medication.name);
      const existing = medicationMap.get(key);

      if (!existing) {
        const created: ClinicalMemoryMedicationFact = {
          label: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          notes: medication.notes,
          status: medication.status,
          sourceDocumentIds: [],
          sourceAppointmentIds: [],
          lastSeenAt: observedAt,
        };
        registerSource(created, context);
        medicationMap.set(key, created);
        continue;
      }

      registerSource(existing, context);
      if (!existing.lastSeenAt || new Date(observedAt) >= new Date(existing.lastSeenAt)) {
        existing.label = medication.name;
        existing.dosage = medication.dosage;
        existing.frequency = medication.frequency;
        existing.notes = medication.notes;
        existing.status = medication.status;
      }
    }
  }

  for (const [key, activeCondition] of activeConditionMap) {
    historicalConditionMap.delete(key);
    if (!activeCondition.lastSeenAt) {
      continue;
    }

    if (new Date(activeCondition.lastSeenAt) < cutoffDate) {
      historicalConditionMap.set(key, activeCondition);
      activeConditionMap.delete(key);
    }
  }

  memory.activeConditions = sortFacts([...activeConditionMap.values()]);
  memory.historicalConditions = sortFacts([...historicalConditionMap.values()]);
  memory.activeMedications = sortMedications(
    [...medicationMap.values()].filter((medication) => medication.status !== 'suspended')
  );
  memory.importantFindings = sortFacts([...findingMap.values()]);
  memory.pendingStudies = sortFacts([...pendingStudyMap.values()]);
  memory.followUpRecommendations = sortFollowUps([...followUpMap.values()]);
  memory.lastUpdatedAt = new Date();
  memory.updatedAt = new Date();

  await em.flush();

  return serializeClinicalMemory(memory);
}
