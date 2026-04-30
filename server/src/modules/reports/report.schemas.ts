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
      record.insurance === undefined
        ? undefined
        : (() => {
            const insurance = parseObject(record.insurance, 'Seguro inválido');
            return {
              provider: parseNonEmptyString(insurance.provider, 'El seguro requiere proveedor'),
              policyNumber: parseNonEmptyString(
                insurance.policyNumber,
                'El seguro requiere número de póliza'
              ),
              groupNumber: parseOptionalString(insurance.groupNumber),
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
