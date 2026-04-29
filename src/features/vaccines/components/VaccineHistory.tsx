import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Syringe, Plus, Trash2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Vaccine } from '../../../shared/api/contracts';

interface VaccineHistoryProps {
  vaccines: Vaccine[];
  onAdd: (vaccine: Omit<Vaccine, 'id'>) => void;
  onRemove: (id: string) => void;
}

const COMMON_VACCINES = [
  'COVID-19',
  'Influenza (Gripe)',
  'Hepatitis A',
  'Hepatitis B',
  'Tétanos',
  'Difteria',
  'Tosferina',
  'Sarampión',
  'Rubéola',
  'Parotiditis',
  'Varicela',
  'Neumococo',
  'Fiebre Amarilla',
  'HPV (Papiloma Humano)',
  'Otra'
];

export function VaccineHistory({ vaccines, onAdd, onRemove }: VaccineHistoryProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDose, setNextDose] = useState('');
  const [doseNumber, setDoseNumber] = useState('');
  const [totalDoses, setTotalDoses] = useState('');
  const [location, setLocation] = useState('');
  const [lot, setLot] = useState('');
  const [notes, setNotes] = useState('');

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    return vaccines
      .filter(v => v.nextDose && new Date(v.nextDose) > today)
      .map(v => ({
        ...v,
        daysUntil: differenceInDays(new Date(v.nextDose!), today)
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [vaccines]);

  const overdueReminders = useMemo(() => {
    const today = new Date();
    return vaccines
      .filter(v => v.nextDose && new Date(v.nextDose) < today)
      .map(v => ({
        ...v,
        daysOverdue: differenceInDays(today, new Date(v.nextDose!))
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [vaccines]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const vaccineName = name === 'Otra' ? customName : name;
    if (!vaccineName.trim()) return;

    const vaccine: Omit<Vaccine, 'id'> = {
      name: vaccineName.trim(),
      date: new Date(date),
      nextDose: nextDose ? new Date(nextDose) : undefined,
      doseNumber: doseNumber ? parseInt(doseNumber) : undefined,
      totalDoses: totalDoses ? parseInt(totalDoses) : undefined,
      location: location.trim() || undefined,
      lot: lot.trim() || undefined,
      notes: notes.trim() || undefined
    };

    onAdd(vaccine);
    resetForm();
    setShowForm(false);
  }

  function resetForm() {
    setName('');
    setCustomName('');
    setDate(new Date().toISOString().split('T')[0]);
    setNextDose('');
    setDoseNumber('');
    setTotalDoses('');
    setLocation('');
    setLot('');
    setNotes('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Syringe className="w-7 h-7 text-blue-600" />
            Historial de Vacunas
          </h2>
          <p className="text-gray-600 mt-1">Mantén tu calendario de vacunación al día</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Vacuna
        </button>
      </div>

      {/* Alertas de Próximas Dosis */}
      {overdueReminders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Dosis Atrasadas</h3>
              <div className="space-y-2">
                {overdueReminders.map(vaccine => (
                  <div key={vaccine.id} className="text-sm text-red-800">
                    <span className="font-medium">{vaccine.name}</span>
                    {' - '}
                    <span className="text-red-600">
                      {vaccine.daysOverdue} día{vaccine.daysOverdue !== 1 ? 's' : ''} de retraso
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {upcomingReminders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Próximas Dosis</h3>
              <div className="space-y-2">
                {upcomingReminders.slice(0, 3).map(vaccine => (
                  <div key={vaccine.id} className="text-sm">
                    <span className="font-medium text-blue-900">{vaccine.name}</span>
                    {' - '}
                    <span className="text-blue-700">
                      en {vaccine.daysUntil} día{vaccine.daysUntil !== 1 ? 's' : ''}
                    </span>
                    {' '}
                    <span className="text-blue-600">
                      ({format(new Date(vaccine.nextDose!), "d 'de' MMM", { locale: es })})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar Vacuna</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Vacuna *
              </label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar vacuna</option>
                {COMMON_VACCINES.map(vaccine => (
                  <option key={vaccine} value={vaccine}>{vaccine}</option>
                ))}
              </select>
            </div>

            {name === 'Otra' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Personalizado *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre de la vacuna"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Aplicación *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próxima Dosis (Opcional)
                </label>
                <input
                  type="date"
                  value={nextDose}
                  onChange={(e) => setNextDose(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Dosis
                </label>
                <input
                  type="number"
                  value={doseNumber}
                  onChange={(e) => setDoseNumber(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total de Dosis
                </label>
                <input
                  type="number"
                  value={totalDoses}
                  onChange={(e) => setTotalDoses(e.target.value)}
                  placeholder="3"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar de Aplicación
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hospital, clínica..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Lote
                </label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  placeholder="Lote de la vacuna"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reacciones, observaciones..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Vacuna
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de Vacunas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Historial Completo</h3>
        {vaccines.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">
            No hay vacunas registradas. Agrega tu primera vacuna para comenzar tu historial.
          </p>
        ) : (
          <div className="space-y-3">
            {[...vaccines]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(vaccine => (
                <div key={vaccine.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{vaccine.name}</h4>
                        {vaccine.doseNumber && vaccine.totalDoses && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Dosis {vaccine.doseNumber}/{vaccine.totalDoses}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(vaccine.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                      {vaccine.location && (
                        <p className="text-sm text-gray-500 mt-1">📍 {vaccine.location}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(vaccine.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Eliminar vacuna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {vaccine.nextDose && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          Próxima dosis:{' '}
                          <span className="font-medium text-blue-600">
                            {format(new Date(vaccine.nextDose), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {vaccine.lot && (
                    <p className="text-xs text-gray-500 mt-2">Lote: {vaccine.lot}</p>
                  )}

                  {vaccine.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{vaccine.notes}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {vaccines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{vaccines.length}</p>
            <p className="text-blue-100">Vacunas Aplicadas</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <Clock className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{upcomingReminders.length}</p>
            <p className="text-orange-100">Próximas Dosis</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
            <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{overdueReminders.length}</p>
            <p className="text-red-100">Dosis Atrasadas</p>
          </div>
        </div>
      )}
    </div>
  );
}
