import { X, Plus, Upload, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { TagManager } from './TagManager';
import type {
  Appointment,
  AppointmentTag,
  Control,
  Document,
  DocumentType,
} from '../../../shared/api/contracts';
import {
  canonicalizeAutocompleteValue,
  normalizeAutocompleteValue,
  sanitizeAutocompleteValue,
} from '../lib/autocomplete';

type PendingControl = Omit<Control, 'specialty' | 'doctor' | 'relatedAppointmentId'>;

interface AddAppointmentModalProps {
  onClose: () => void;
  onAdd: (appointment: {
    id?: string;
    date: Date;
    specialty: string;
    doctor: string;
    documents: Document[];
    notes?: string;
    tags?: string[];
    controls?: PendingControl[];
  }) => void;
  existingDoctors: string[];
  existingSpecialties: string[];
  editingAppointment?: Appointment;
  initialDraft?: {
    date: Date;
    specialty: string;
    doctor: string;
    documents: Document[];
    notes?: string;
  };
  existingControls?: Control[];
  availableTags?: AppointmentTag[];
  onCreateTag?: (tag: Omit<AppointmentTag, 'id'>) => void;
}

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: 'historia_clinica', label: 'Historia Clínica' },
  { value: 'orden_procedimiento', label: 'Orden de Procedimiento' },
  { value: 'orden_medicamento', label: 'Orden de Medicamento' },
  { value: 'orden_control', label: 'Orden de Control' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

function toDateInputValue(date: Date | string | undefined): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return Number.isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function AddAppointmentModal({
  onClose,
  onAdd,
  existingDoctors,
  existingSpecialties,
  editingAppointment,
  initialDraft,
  existingControls = [],
  availableTags,
  onCreateTag,
}: AddAppointmentModalProps) {
  const [date, setDate] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<Omit<Document, 'id'>[]>([]);
  const [controls, setControls] = useState<PendingControl[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!editingAppointment) {
      if (initialDraft) {
        setDate(toDateInputValue(initialDraft.date));
        setSpecialty(initialDraft.specialty);
        setDoctor(initialDraft.doctor);
        setNotes(initialDraft.notes || '');
        setSelectedTags([]);
        setDocuments(
          initialDraft.documents.map((document) => ({
            type: document.type,
            name: document.name,
            date: document.date instanceof Date ? document.date : new Date(document.date),
            file: document.file,
            fileUrl: document.fileUrl,
            aiSummary: undefined,
            aiSummaryStatus: 'idle',
            aiSummaryError: undefined,
            aiSummaryUpdatedAt: undefined,
          }))
        );
        setControls([]);
        return;
      }

      setDate('');
      setSpecialty('');
      setDoctor('');
      setNotes('');
      setSelectedTags([]);
      setDocuments([]);
      setControls([]);
      return;
    }

    setDate(toDateInputValue(editingAppointment.date));
    setSpecialty(editingAppointment.specialty);
    setDoctor(editingAppointment.doctor);
    setNotes(editingAppointment.notes || '');
    setSelectedTags(editingAppointment.tags || []);
    setDocuments(
      editingAppointment.documents.map((document) => ({
        type: document.type,
        name: document.name,
        date: document.date instanceof Date ? document.date : new Date(document.date),
        file: document.file,
        fileUrl: document.fileUrl,
        aiSummary: document.aiSummary,
        aiSummaryStatus: document.aiSummaryStatus,
        aiSummaryError: document.aiSummaryError,
        aiSummaryUpdatedAt: document.aiSummaryUpdatedAt,
      }))
    );
    setControls(
      existingControls.map((control) => ({
        id: control.id,
        date: control.date instanceof Date ? control.date : new Date(control.date),
        type: control.type,
      }))
    );
  }, [editingAppointment, existingControls, initialDraft]);

  const handleAddDocument = () => {
    setDocuments([
      ...documents,
      {
        type: 'historia_clinica',
        name: '',
        date: startOfDay(new Date()),
        aiSummaryStatus: 'idle',
      },
    ]);
  };

  const handleAddControl = () => {
    setControls([
      ...controls,
      { id: crypto.randomUUID(), date: startOfDay(new Date()), type: '' },
    ]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleRemoveControl = (index: number) => {
    setControls(controls.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDocumentChange = (
    index: number,
    field: keyof Omit<Document, 'id'>,
    value: unknown
  ) => {
    const next = [...documents];
    next[index] = { ...next[index], [field]: value };
    setDocuments(next);
  };

  const handleFileUpload = (index: number, file: File) => {
    const next = [...documents];
    next[index] = {
      ...next[index],
      file,
      fileUrl: URL.createObjectURL(file),
      name: next[index].name || file.name,
      aiSummary: undefined,
      aiSummaryStatus: 'idle',
      aiSummaryError: undefined,
      aiSummaryUpdatedAt: undefined,
    };
    setDocuments(next);
  };

  const handleControlChange = (
    index: number,
    field: keyof PendingControl,
    value: unknown
  ) => {
    const next = [...controls];
    next[index] = { ...next[index], [field]: value };
    setControls(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedSpecialty = canonicalizeAutocompleteValue(specialty, existingSpecialties);
    const normalizedDoctor = canonicalizeAutocompleteValue(doctor, existingDoctors);

    if (!date || !normalizedSpecialty || !normalizedDoctor) return;

    onAdd({
      id: editingAppointment?.id,
      date: startOfDay(new Date(date)),
      specialty: normalizedSpecialty,
      doctor: normalizedDoctor,
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      documents: documents.map((document, index) => ({
        ...document,
        date: document.date instanceof Date ? document.date : new Date(document.date),
        id: editingAppointment?.documents[index]?.id || crypto.randomUUID(),
      })),
      controls:
        controls.length > 0
          ? controls.map((control) => ({
              ...control,
              date: control.date instanceof Date ? control.date : new Date(control.date),
            }))
          : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 pb-24 md:p-4">
      <div className="max-h-[calc(100vh-7rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white md:max-h-[90vh]">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingAppointment ? 'Editar Cita Médica' : 'Nueva Cita Médica'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-28 md:p-6 md:pb-6">
          <div className="mb-6 space-y-4">
            <InputField
              label="Fecha de la cita"
              type="date"
              value={date}
              onChange={setDate}
              required
            />
            <AutocompleteField
              label="Especialidad"
              value={specialty}
              onChange={setSpecialty}
              placeholder="Ej: Cardiología, Medicina General"
              options={existingSpecialties}
              helper={
                existingSpecialties.length > 0
                  ? 'Escribe para ver sugerencias y reutilizar especialidades ya guardadas'
                  : undefined
              }
            />
            <AutocompleteField
              label="Médico"
              value={doctor}
              onChange={setDoctor}
              placeholder="Nombre del médico"
              options={existingDoctors}
              helper={
                existingDoctors.length > 0
                  ? 'Escribe para ver sugerencias y reutilizar médicos ya guardados'
                  : undefined
              }
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones adicionales"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {availableTags && (
              <TagManager
                tags={availableTags}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                onCreateTag={onCreateTag}
                availableTags={availableTags}
              />
            )}
          </div>

          <SectionHeader
            title="Documentos"
            actionLabel="Agregar documento"
            onClick={handleAddDocument}
          />
          <div className="mb-6 space-y-3">
            {documents.map((document, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Tipo de documento
                    </label>
                    <select
                      value={document.type}
                      onChange={(event) => handleDocumentChange(index, 'type', event.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label="Fecha del documento"
                    type="date"
                    value={toDateInputValue(document.date)}
                    onChange={(value) => handleDocumentChange(index, 'date', new Date(value))}
                    compact
                  />
                </div>

                <input
                  type="text"
                  value={document.name}
                  onChange={(event) => handleDocumentChange(index, 'name', event.target.value)}
                  placeholder="Nombre o descripción del documento"
                  className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex gap-2">
                  <label className="flex-1">
                    <div className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 px-3 py-2 text-sm transition-colors hover:border-blue-500 hover:bg-blue-50">
                      <Upload className="h-4 w-4" />
                      <span>{document.file ? document.file.name : 'Subir archivo (PDF, imagen)'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleFileUpload(index, file);
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="rounded px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <SectionHeader
            title="Controles Programados"
            actionLabel="Agregar control"
            onClick={handleAddControl}
            green
          />
          <div className="mb-6 space-y-3">
            {controls.map((control, index) => (
              <div key={control.id} className="rounded-lg border border-gray-200 bg-green-50 p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    type="date"
                    value={toDateInputValue(control.date)}
                    onChange={(event) =>
                      handleControlChange(index, 'date', new Date(event.target.value))
                    }
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveControl(index)}
                    className="rounded px-3 py-1.5 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={control.type}
                  onChange={(event) => handleControlChange(index, 'type', event.target.value)}
                  placeholder="Tipo de control (ej: Control en 3 meses, Revisión anual)"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 flex gap-3 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur md:static md:m-0 md:border-t-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {editingAppointment ? 'Actualizar Cita' : 'Guardar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onClick,
  green,
}: {
  title: string;
  actionLabel: string;
  onClick: () => void;
  green?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white transition-colors ${
          green ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  required,
  compact,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`mb-1 block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-gray-300 ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        required={required}
      />
    </div>
  );
}

function AutocompleteField({
  label,
  value,
  onChange,
  placeholder,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  helper?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedValue = normalizeAutocompleteValue(value);
    const baseOptions = normalizedValue
      ? options.filter((option) =>
          normalizeAutocompleteValue(option).includes(normalizedValue)
        )
      : options;

    return baseOptions.slice(0, 8);
  }, [options, value]);

  const hasSuggestions = filteredOptions.length > 0;

  const handleBlur = () => {
    setIsOpen(false);
    onChange(canonicalizeAutocompleteValue(value, options));
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      {isOpen && hasSuggestions && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(option);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      {!helper && sanitizeAutocompleteValue(value) && !hasSuggestions && (
        <p className="mt-1 text-xs text-gray-500">
          Si no existe una coincidencia, guardaremos este valor como nuevo.
        </p>
      )}
    </div>
  );
}
