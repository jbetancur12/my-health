import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pill, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import type { Medication } from '../../../shared/api/contracts';

interface MedicationManagerProps {
  medications: Medication[];
  onAdd: (medication: Omit<Medication, 'id'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

export function MedicationManager({
  medications,
  onAdd,
  onRemove,
  onToggle,
}: MedicationManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onAdd({
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      notes: notes || undefined,
      active: true,
    });

    setName('');
    setDosage('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setShowForm(false);
  };

  const activeMeds = medications.filter((medication) => medication.active);
  const inactiveMeds = medications.filter((medication) => !medication.active);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Pill className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Medicamentos</h2>
            <p className="text-sm text-gray-600">
              {activeMeds.length} activo{activeMeds.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <MedicationInput
              label="Medicamento"
              value={name}
              onChange={setName}
              placeholder="Nombre del medicamento"
              required
            />
            <MedicationInput
              label="Dosis"
              value={dosage}
              onChange={setDosage}
              placeholder="Ej: 500mg, 1 tableta"
              required
            />
            <MedicationInput
              label="Frecuencia"
              value={frequency}
              onChange={setFrequency}
              placeholder="Ej: Cada 8 horas, 2 veces al día"
              required
            />
            <MedicationInput
              label="Fecha de inicio"
              type="date"
              value={startDate}
              onChange={setStartDate}
              required
            />
            <MedicationInput
              label="Fecha de fin (opcional)"
              type="date"
              value={endDate}
              onChange={setEndDate}
            />
            <MedicationInput
              label="Notas (opcional)"
              value={notes}
              onChange={setNotes}
              placeholder="Instrucciones adicionales"
              wide
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {activeMeds.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Medicamentos Activos</h3>
          <div className="space-y-2">
            {activeMeds.map((medication) => (
              <div
                key={medication.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{medication.name}</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        <span>{medication.dosage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{medication.frequency}</span>
                      </div>
                      {medication.notes && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <span>{medication.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggle(medication.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Marcar como inactivo"
                    >
                      <span className="text-sm">✓</span>
                    </button>
                    <button
                      onClick={() => onRemove(medication.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveMeds.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Historial</h3>
          <div className="space-y-2">
            {inactiveMeds.map((medication) => (
              <div
                key={medication.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700">{medication.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {medication.dosage} - {medication.frequency}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggle(medication.id)}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                      title="Reactivar"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => onRemove(medication.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicationInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  wide,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}
