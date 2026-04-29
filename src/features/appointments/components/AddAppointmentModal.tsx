import { X, Plus, Upload, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { TagManager } from './TagManager';
import type { Appointment, AppointmentTag, Document, DocumentType } from '../../../shared/api/contracts';

interface PendingControl {
  id: string;
  date: Date;
  type: string;
}

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

export function AddAppointmentModal({
  onClose,
  onAdd,
  existingDoctors,
  existingSpecialties,
  editingAppointment,
  availableTags,
  onCreateTag,
}: AddAppointmentModalProps) {
  const [date, setDate] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<Omit<Document, 'id'>[]>([]);
  const [controls, setControls] = useState<Omit<PendingControl, 'id'>[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!editingAppointment) return;

    setDate(toDateInputValue(editingAppointment.date));
    setSpecialty(editingAppointment.specialty);
    setDoctor(editingAppointment.doctor);
    setNotes(editingAppointment.notes || '');
    setSelectedTags(editingAppointment.tags || []);
    setDocuments(editingAppointment.documents.map((document) => ({
      type: document.type,
      name: document.name,
      date: document.date instanceof Date ? document.date : new Date(document.date),
      file: document.file,
      fileUrl: document.fileUrl,
    })));
  }, [editingAppointment]);

  const handleAddDocument = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDocuments([...documents, { type: 'historia_clinica', name: '', date: today }]);
  };

  const handleAddControl = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setControls([...controls, { date: today, type: '' }]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleRemoveControl = (index: number) => {
    setControls(controls.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDocumentChange = (index: number, field: keyof Omit<Document, 'id'>, value: unknown) => {
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
    };
    setDocuments(next);
  };

  const handleControlChange = (index: number, field: keyof Omit<PendingControl, 'id'>, value: unknown) => {
    const next = [...controls];
    next[index] = { ...next[index], [field]: value };
    setControls(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!date || !specialty || !doctor) return;

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    onAdd({
      id: editingAppointment?.id,
      date: appointmentDate,
      specialty,
      doctor,
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      documents: documents.map((document, index) => ({
        ...document,
        date: document.date instanceof Date ? document.date : new Date(document.date),
        id: editingAppointment?.documents[index]?.id || crypto.randomUUID(),
      })),
      controls: controls.length > 0
        ? controls.map((control) => ({
            ...control,
            date: control.date instanceof Date ? control.date : new Date(control.date),
            id: crypto.randomUUID(),
          }))
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingAppointment ? 'Editar Cita Médica' : 'Nueva Cita Médica'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <InputField label="Fecha de la cita" type="date" value={date} onChange={setDate} required />
            <DatalistField
              label="Especialidad"
              value={specialty}
              onChange={setSpecialty}
              placeholder="Ej: Cardiología, Medicina General"
              listId="specialties-list"
              options={existingSpecialties}
              helper={existingSpecialties.length > 0 ? 'Selecciona una especialidad existente o escribe una nueva' : undefined}
            />
            <DatalistField
              label="Médico"
              value={doctor}
              onChange={setDoctor}
              placeholder="Nombre del médico"
              listId="doctors-list"
              options={existingDoctors}
              helper={existingDoctors.length > 0 ? 'Selecciona un médico existente o escribe uno nuevo' : undefined}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones adicionales"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

          <SectionHeader title="Documentos" actionLabel="Agregar documento" onClick={handleAddDocument} />
          <div className="space-y-3 mb-6">
            {documents.map((document, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento</label>
                    <select
                      value={document.type}
                      onChange={(event) => handleDocumentChange(index, 'type', event.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
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
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />

                <div className="flex gap-2">
                  <label className="flex-1">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload className="w-4 h-4" />
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
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <SectionHeader title="Controles Programados" actionLabel="Agregar control" onClick={handleAddControl} green />
          <div className="space-y-3 mb-6">
            {controls.map((control, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-green-50">
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={toDateInputValue(control.date)}
                    onChange={(event) => handleControlChange(index, 'date', new Date(event.target.value))}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveControl(index)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={control.type}
                  onChange={(event) => handleControlChange(index, 'type', event.target.value)}
                  placeholder="Tipo de control (ej: Control en 3 meses, Revisión anual)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 text-white rounded-lg transition-colors text-sm ${
          green ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <Plus className="w-4 h-4" />
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
      <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
        required={required}
      />
    </div>
  );
}

function DatalistField({
  label,
  value,
  onChange,
  placeholder,
  listId,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  listId: string;
  options: string[];
  helper?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
}
