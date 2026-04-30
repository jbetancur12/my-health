import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarPlus, Plus, Trash2, X } from 'lucide-react';
import type {
  DocumentType,
  ScheduledAppointment,
  ScheduledAppointmentApiPayload,
} from '../../../shared/api/contracts';

interface ScheduledAppointmentModalProps {
  doctors: string[];
  open: boolean;
  scheduledAppointment?: ScheduledAppointment;
  specialties: string[];
  onClose: () => void;
  onDelete?: (scheduledAppointment: ScheduledAppointment) => void;
  onConvert?: (scheduledAppointment: ScheduledAppointment) => void;
  onSave: (
    payload: ScheduledAppointmentApiPayload & {
      id?: string;
    }
  ) => Promise<unknown> | unknown;
}

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: 'historia_clinica', label: 'Historia Clínica' },
  { value: 'orden_procedimiento', label: 'Orden de Procedimiento' },
  { value: 'orden_medicamento', label: 'Orden de Medicamento' },
  { value: 'orden_control', label: 'Orden de Control' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

function toDateTimeLocalValue(date: Date | undefined) {
  if (!date) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toDateInputValue(date: Date | string | undefined) {
  if (!date) {
    return '';
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
}

export function ScheduledAppointmentModal({
  doctors,
  open,
  scheduledAppointment,
  specialties,
  onClose,
  onDelete,
  onConvert,
  onSave,
}: ScheduledAppointmentModalProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDocuments, setExpectedDocuments] = useState<ScheduledAppointment['expectedDocuments']>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!scheduledAppointment) {
      setScheduledAt('');
      setSpecialty('');
      setDoctor('');
      setLocation('');
      setNotes('');
      setExpectedDocuments([]);
      return;
    }

    setScheduledAt(toDateTimeLocalValue(scheduledAppointment.scheduledAt));
    setSpecialty(scheduledAppointment.specialty);
    setDoctor(scheduledAppointment.doctor);
    setLocation(scheduledAppointment.location ?? '');
    setNotes(scheduledAppointment.notes ?? '');
    setExpectedDocuments(scheduledAppointment.expectedDocuments);
  }, [open, scheduledAppointment]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!scheduledAt || !specialty.trim() || !doctor.trim()) {
      return;
    }

    await onSave({
      id: scheduledAppointment?.id,
      scheduledAt: new Date(scheduledAt).toISOString(),
      specialty: specialty.trim(),
      doctor: doctor.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      expectedDocuments: expectedDocuments.map((document) => ({
        id: document.id,
        type: document.type,
        name: document.name.trim() || 'Documento esperado',
        date: document.date.toISOString(),
      })),
      status: scheduledAppointment?.status ?? 'scheduled',
    });

    onClose();
  };

  const handleAddExpectedDocument = () => {
    setExpectedDocuments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: 'historia_clinica',
        name: '',
        date: new Date(),
        aiSummaryStatus: 'idle',
      },
    ]);
  };

  const updateExpectedDocument = (
    index: number,
    patch: Partial<ScheduledAppointment['expectedDocuments'][number]>
  ) => {
    setExpectedDocuments((current) =>
      current.map((document, currentIndex) =>
        currentIndex === index ? { ...document, ...patch } : document
      )
    );
  };

  const removeExpectedDocument = (index: number) => {
    setExpectedDocuments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 pb-24 md:p-4">
      <div className="max-h-[calc(100vh-7rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white md:max-h-[90vh]">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {scheduledAppointment ? 'Editar cita programada' : 'Programar nueva cita'}
            </h2>
            <p className="text-sm text-gray-500">
              Esta cita aparecerá en el calendario y luego podrás convertirla en una cita real.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 pb-28 md:p-6 md:pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Fecha y hora"
              type="datetime-local"
              value={scheduledAt}
              onChange={setScheduledAt}
              required
            />
            <InputField
              label="Ubicación o sede"
              type="text"
              value={location}
              onChange={setLocation}
              placeholder="Opcional"
            />
          </div>

          <DatalistField
            label="Especialidad"
            value={specialty}
            onChange={setSpecialty}
            options={specialties}
            placeholder="Ej: Cardiología"
          />

          <DatalistField
            label="Médico"
            value={doctor}
            onChange={setDoctor}
            options={doctors}
            placeholder="Nombre del médico"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notas previas</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Motivo, preparación o datos que quieras dejar listos"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Documentos esperados</h3>
              <button
                type="button"
                onClick={handleAddExpectedDocument}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Agregar documento esperado
              </button>
            </div>

            <div className="space-y-3">
              {expectedDocuments.map((document, index) => (
                <div key={document.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Tipo
                      </label>
                      <select
                        value={document.type}
                        onChange={(event) =>
                          updateExpectedDocument(index, {
                            type: event.target.value as DocumentType,
                          })
                        }
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
                      compact
                      label="Fecha esperada"
                      type="date"
                      value={toDateInputValue(document.date)}
                      onChange={(value) => updateExpectedDocument(index, { date: new Date(value) })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={document.name}
                      onChange={(event) =>
                        updateExpectedDocument(index, {
                          name: event.target.value,
                        })
                      }
                      placeholder="Ej: Orden de laboratorio, resultados, fórmula"
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeExpectedDocument(index)}
                      className="rounded-lg px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap gap-3 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur md:static md:m-0 md:border-t-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            {scheduledAppointment && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(scheduledAppointment)}
                className="rounded-lg border border-red-200 px-4 py-2 text-red-700 transition-colors hover:bg-red-50"
              >
                Eliminar
              </button>
            ) : null}

            {scheduledAppointment && onConvert ? (
              <button
                type="button"
                onClick={() => onConvert(scheduledAppointment)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
              >
                Registrar cita realizada
              </button>
            ) : null}

            <div className="ml-auto flex flex-1 gap-3 md:flex-initial">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <CalendarPlus className="h-4 w-4" />
                {scheduledAppointment ? 'Guardar cambios' : 'Programar cita'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  compact,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  placeholder?: string;
  required?: boolean;
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
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-lg border border-gray-300 ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    </div>
  );
}

function DatalistField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  const listId = `${label.toLowerCase().replace(/\s+/g, '-')}-list`;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}
