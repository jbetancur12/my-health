import type { DocumentType } from '../../../../shared/contracts/http.js';
import type { ExecutiveReportInput } from './report.types.js';
import { ValidationError } from '../shared/validation.js';
import {
  parseArray,
  parseBoolean,
  parseDateLike,
  parseNonEmptyString,
  parseObject,
  parseOptionalArray,
  parseOptionalNumber,
  parseOptionalString,
} from '../shared/validation.js';

function parseDocument(input: unknown) {
  const record = parseObject(input, 'Documento inválido para reporte');

    return {
      id: parseNonEmptyString(record.id, 'El documento requiere id'),
      type: parseNonEmptyString(record.type, 'El documento requiere tipo') as DocumentType,
    name: parseNonEmptyString(record.name, 'El documento requiere nombre'),
    date: parseDateLike(record.date, 'El documento requiere fecha'),
    fileUrl: parseOptionalString(record.fileUrl),
    aiSummary: parseOptionalString(record.aiSummary),
    aiSummaryStatus: parseNonEmptyString(
      record.aiSummaryStatus,
      'El documento requiere estado de resumen IA'
    ) as 'idle' | 'pending' | 'processing' | 'completed' | 'failed',
    aiSummaryError: parseOptionalString(record.aiSummaryError),
    aiSummaryUpdatedAt: parseOptionalString(record.aiSummaryUpdatedAt),
  };
}

function parseClinicalMemoryFact(input: unknown) {
  const record = parseObject(input, 'Hecho de memoria clínica inválido');

  return {
    label: parseNonEmptyString(record.label, 'El hecho de memoria clínica requiere label'),
    sourceDocumentIds:
      parseOptionalArray(record.sourceDocumentIds)?.map((item) =>
        parseNonEmptyString(item, 'Cada sourceDocumentId debe ser texto')
      ) ?? [],
    sourceAppointmentIds:
      parseOptionalArray(record.sourceAppointmentIds)?.map((item) =>
        parseNonEmptyString(item, 'Cada sourceAppointmentId debe ser texto')
      ) ?? [],
    lastSeenAt: parseOptionalString(record.lastSeenAt),
  };
}

function parseClinicalMemoryMedicationFact(input: unknown) {
  const fact = parseClinicalMemoryFact(input);
  const record = parseObject(input, 'Medicamento de memoria clínica inválido');

  return {
    ...fact,
    dosage: parseOptionalString(record.dosage),
    frequency: parseOptionalString(record.frequency),
    notes: parseOptionalString(record.notes),
    status: parseNonEmptyString(
      record.status,
      'El medicamento de memoria clínica requiere estado'
    ) as 'active' | 'suspended' | 'mentioned',
  };
}

function parseClinicalMemoryFollowUpFact(input: unknown) {
  const fact = parseClinicalMemoryFact(input);
  const record = parseObject(input, 'Control de memoria clínica inválido');

  return {
    ...fact,
    description: parseNonEmptyString(
      record.description,
      'La recomendación de control requiere descripción'
    ),
    interval: parseOptionalString(record.interval),
    suggestedSpecialty: parseOptionalString(record.suggestedSpecialty),
  };
}

function parseClinicalMemory(input: unknown) {
  if (input === undefined || input === null) {
    return undefined;
  }

  const record = parseObject(input, 'Memoria clínica inválida para reporte');

  return {
    id: parseOptionalString(record.id),
    activeConditions:
      parseOptionalArray(record.activeConditions)?.map(parseClinicalMemoryFact) ?? [],
    historicalConditions:
      parseOptionalArray(record.historicalConditions)?.map(parseClinicalMemoryFact) ?? [],
    activeMedications:
      parseOptionalArray(record.activeMedications)?.map(parseClinicalMemoryMedicationFact) ?? [],
    importantFindings:
      parseOptionalArray(record.importantFindings)?.map(parseClinicalMemoryFact) ?? [],
    pendingStudies:
      parseOptionalArray(record.pendingStudies)?.map(parseClinicalMemoryFact) ?? [],
    followUpRecommendations:
      parseOptionalArray(record.followUpRecommendations)?.map(parseClinicalMemoryFollowUpFact) ??
      [],
    lastUpdatedAt: parseOptionalString(record.lastUpdatedAt),
    createdAt: parseOptionalString(record.createdAt),
    updatedAt: parseOptionalString(record.updatedAt),
  };
}

function parseAppointment(input: unknown) {
  const record = parseObject(input, 'Cita inválida para reporte');

  return {
    id: parseNonEmptyString(record.id, 'La cita requiere id'),
    date: parseDateLike(record.date, 'La cita requiere fecha'),
    specialty: parseNonEmptyString(record.specialty, 'La cita requiere especialidad'),
    doctor: parseNonEmptyString(record.doctor, 'La cita requiere médico'),
    notes: parseOptionalString(record.notes),
    tags: parseOptionalArray(record.tags)?.map((item) =>
      parseNonEmptyString(item, 'Cada tag debe ser texto')
    ),
    createdAt: parseDateLike(record.createdAt ?? record.date, 'La cita requiere createdAt'),
    documents: parseArray(record.documents, 'La cita requiere documentos').map(parseDocument),
  };
}

function parseMedication(input: unknown) {
  const record = parseObject(input, 'Medicamento inválido para reporte');

  return {
    id: parseNonEmptyString(record.id, 'El medicamento requiere id'),
    name: parseNonEmptyString(record.name, 'El medicamento requiere nombre'),
    dosage: parseNonEmptyString(record.dosage, 'El medicamento requiere dosis'),
    frequency: parseNonEmptyString(record.frequency, 'El medicamento requiere frecuencia'),
    startDate: parseDateLike(record.startDate, 'El medicamento requiere fecha de inicio'),
    endDate: parseOptionalString(record.endDate),
    notes: parseOptionalString(record.notes),
    active: parseBoolean(record.active, 'El medicamento requiere estado activo'),
    createdAt: parseDateLike(
      record.createdAt ?? record.startDate,
      'El medicamento requiere createdAt'
    ),
  };
}

function parseVaccine(input: unknown) {
  const record = parseObject(input, 'Vacuna inválida para reporte');

  return {
    id: parseNonEmptyString(record.id, 'La vacuna requiere id'),
    name: parseNonEmptyString(record.name, 'La vacuna requiere nombre'),
    date: parseDateLike(record.date, 'La vacuna requiere fecha'),
    nextDose: parseOptionalString(record.nextDose),
    doseNumber: parseOptionalNumber(record.doseNumber),
    totalDoses: parseOptionalNumber(record.totalDoses),
    location: parseOptionalString(record.location),
    lot: parseOptionalString(record.lot),
    notes: parseOptionalString(record.notes),
    createdAt: parseDateLike(record.createdAt ?? record.date, 'La vacuna requiere createdAt'),
  };
}

function parseVitalSign(input: unknown) {
  const record = parseObject(input, 'Signo vital inválido para reporte');

  return {
    id: parseNonEmptyString(record.id, 'El signo vital requiere id'),
    date: parseDateLike(record.date, 'El signo vital requiere fecha'),
    bloodPressureSystolic: parseOptionalNumber(record.bloodPressureSystolic),
    bloodPressureDiastolic: parseOptionalNumber(record.bloodPressureDiastolic),
    heartRate: parseOptionalNumber(record.heartRate),
    weight: parseOptionalNumber(record.weight),
    glucose: parseOptionalNumber(record.glucose),
    temperature: parseOptionalNumber(record.temperature),
    oxygenSaturation: parseOptionalNumber(record.oxygenSaturation),
    notes: parseOptionalString(record.notes),
    createdAt: parseDateLike(record.createdAt ?? record.date, 'El signo vital requiere createdAt'),
  };
}

function parseEmergencyContact(input: unknown) {
  const record = parseObject(input, 'Contacto de emergencia inválido');
  return {
    id: parseOptionalString(record.id),
    name: parseNonEmptyString(record.name, 'El contacto requiere nombre'),
    relationship: parseNonEmptyString(record.relationship, 'El contacto requiere parentesco'),
    phone: parseNonEmptyString(record.phone, 'El contacto requiere teléfono'),
  };
}

function parseMedicalProfile(input: unknown) {
  const record = parseObject(input, 'Perfil médico inválido para reporte');

  return {
    id: parseOptionalString(record.id),
    bloodType: parseOptionalString(record.bloodType),
    allergies:
      parseOptionalArray(record.allergies)?.map((item) =>
        parseNonEmptyString(item, 'Cada alergia debe ser texto')
      ) ?? [],
    chronicConditions:
      parseOptionalArray(record.chronicConditions)?.map((item) =>
        parseNonEmptyString(item, 'Cada condición debe ser texto')
      ) ?? [],
    emergencyContacts:
      parseOptionalArray(record.emergencyContacts)?.map(parseEmergencyContact) ?? [],
    insurance:
      record.insurance === undefined ||
      record.insurance === null ||
      typeof record.insurance !== 'object' ||
      Array.isArray(record.insurance)
        ? undefined
        : (() => {
            const insurance = parseObject(record.insurance, 'Seguro inválido');
            const provider = parseOptionalString(insurance.provider);
            const policyNumber = parseOptionalString(insurance.policyNumber);
            const groupNumber = parseOptionalString(insurance.groupNumber);

            if (!provider || !policyNumber) {
              return undefined;
            }

            return {
              provider,
              policyNumber,
              groupNumber,
            };
          })(),
    notes: parseOptionalString(record.notes),
    createdAt: parseOptionalString(record.createdAt),
    updatedAt: parseOptionalString(record.updatedAt),
  };
}

export function parseExecutiveReportInput(input: unknown): ExecutiveReportInput {
  const record = parseObject(input, 'Payload inválido para reporte ejecutivo');
  const dateRange = parseNonEmptyString(record.dateRange, 'El reporte requiere un rango de fechas');

  if (dateRange !== 'all' && dateRange !== '6months' && dateRange !== '1year') {
    throw new ValidationError('El rango de fechas del reporte no es válido');
  }

  return {
    appointments: parseArray(record.appointments, 'El reporte requiere citas').map(parseAppointment),
    medications: parseArray(record.medications, 'El reporte requiere medicamentos').map(
      parseMedication
    ),
    vaccines: parseArray(record.vaccines, 'El reporte requiere vacunas').map(parseVaccine),
    vitalSigns: parseArray(record.vitalSigns, 'El reporte requiere signos vitales').map(
      parseVitalSign
    ),
    medicalProfile: parseMedicalProfile(record.medicalProfile),
    clinicalMemory: parseClinicalMemory(record.clinicalMemory),
    dateRange,
    includeProfile: parseBoolean(record.includeProfile, 'includeProfile debe ser booleano'),
    includeAppointments: parseBoolean(
      record.includeAppointments,
      'includeAppointments debe ser booleano'
    ),
    includeMedications: parseBoolean(
      record.includeMedications,
      'includeMedications debe ser booleano'
    ),
    includeVaccines: parseBoolean(record.includeVaccines, 'includeVaccines debe ser booleano'),
    includeVitals: parseBoolean(record.includeVitals, 'includeVitals debe ser booleano'),
  };
}
