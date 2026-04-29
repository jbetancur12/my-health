import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { VitalSignReading } from '../../../shared/api/contracts';

interface VitalSignsProps {
  readings: VitalSignReading[];
  onAdd: (reading: Omit<VitalSignReading, 'id'>) => void;
  onRemove: (id: string) => void;
}

export function VitalSigns({ readings, onAdd, onRemove }: VitalSignsProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [glucose, setGlucose] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygen, setOxygen] = useState('');
  const [notes, setNotes] = useState('');

  const chartData = useMemo(() => {
    return readings
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((r) => ({
        date: format(new Date(r.date), 'dd/MM', { locale: es }),
        fullDate: format(new Date(r.date), "d 'de' MMM", { locale: es }),
        systolic: r.bloodPressureSystolic,
        diastolic: r.bloodPressureDiastolic,
        heartRate: r.heartRate,
        weight: r.weight,
        glucose: r.glucose,
        temperature: r.temperature,
        oxygen: r.oxygenSaturation,
      }));
  }, [readings]);

  const latestReading = useMemo(() => {
    if (readings.length === 0) return null;
    return [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [readings]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const reading: Omit<VitalSignReading, 'id'> = {
      date: new Date(date),
      bloodPressureSystolic: systolic ? parseInt(systolic) : undefined,
      bloodPressureDiastolic: diastolic ? parseInt(diastolic) : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      glucose: glucose ? parseInt(glucose) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      oxygenSaturation: oxygen ? parseInt(oxygen) : undefined,
      notes: notes.trim() || undefined,
    };

    onAdd(reading);
    resetForm();
    setShowForm(false);
  }

  function resetForm() {
    setDate(new Date().toISOString().split('T')[0]);
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setWeight('');
    setGlucose('');
    setTemperature('');
    setOxygen('');
    setNotes('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-600" />
            Signos Vitales
          </h2>
          <p className="text-gray-600 mt-1">Seguimiento de tu salud día a día</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>

      {/* Últimas Mediciones */}
      {latestReading && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Última Medición</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestReading.bloodPressureSystolic && (
              <div>
                <p className="text-blue-100 text-sm">Presión Arterial</p>
                <p className="text-2xl font-bold">
                  {latestReading.bloodPressureSystolic}/{latestReading.bloodPressureDiastolic}
                </p>
                <p className="text-blue-200 text-xs">mmHg</p>
              </div>
            )}
            {latestReading.heartRate && (
              <div>
                <p className="text-blue-100 text-sm">Frecuencia Cardíaca</p>
                <p className="text-2xl font-bold">{latestReading.heartRate}</p>
                <p className="text-blue-200 text-xs">bpm</p>
              </div>
            )}
            {latestReading.weight && (
              <div>
                <p className="text-blue-100 text-sm">Peso</p>
                <p className="text-2xl font-bold">{latestReading.weight}</p>
                <p className="text-blue-200 text-xs">kg</p>
              </div>
            )}
            {latestReading.glucose && (
              <div>
                <p className="text-blue-100 text-sm">Glucosa</p>
                <p className="text-2xl font-bold">{latestReading.glucose}</p>
                <p className="text-blue-200 text-xs">mg/dL</p>
              </div>
            )}
          </div>
          <p className="text-blue-100 text-sm mt-4">
            {format(new Date(latestReading.date), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar Signos Vitales</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presión Arterial (mmHg)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="Sistólica"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="flex items-center">/</span>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="Diastólica"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia Cardíaca (bpm)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Glucosa (mg/dL)
                </label>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="36.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saturación O₂ (%)
                </label>
                <input
                  type="number"
                  value={oxygen}
                  onChange={(e) => setOxygen(e.target.value)}
                  placeholder="98"
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
                placeholder="Observaciones adicionales..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Registro
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

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Presión Arterial */}
          {chartData.some((d) => d.systolic) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Presión Arterial
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      const item = payload[0];
                      return item ? item.payload.fullDate : value;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    stroke="#EF4444"
                    name="Sistólica"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#F59E0B"
                    name="Diastólica"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Peso */}
          {chartData.some((d) => d.weight) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Peso
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      const item = payload[0];
                      return item ? item.payload.fullDate : value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8B5CF6"
                    name="Peso (kg)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Glucosa */}
          {chartData.some((d) => d.glucose) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Glucosa
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      const item = payload[0];
                      return item ? item.payload.fullDate : value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="glucose"
                    stroke="#10B981"
                    name="Glucosa (mg/dL)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Frecuencia Cardíaca */}
          {chartData.some((d) => d.heartRate) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Frecuencia Cardíaca
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      const item = payload[0];
                      return item ? item.payload.fullDate : value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#3B82F6"
                    name="FC (bpm)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Historial de Registros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Historial de Registros</h3>
        {readings.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">
            No hay registros. Agrega tu primera medición para comenzar el seguimiento.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...readings]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((reading) => (
                <div key={reading.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(reading.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                      {reading.notes && (
                        <p className="text-sm text-gray-600 mt-1">{reading.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(reading.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {reading.bloodPressureSystolic && (
                      <div>
                        <span className="text-gray-600">PA:</span>
                        <span className="ml-1 font-medium">
                          {reading.bloodPressureSystolic}/{reading.bloodPressureDiastolic}
                        </span>
                      </div>
                    )}
                    {reading.heartRate && (
                      <div>
                        <span className="text-gray-600">FC:</span>
                        <span className="ml-1 font-medium">{reading.heartRate} bpm</span>
                      </div>
                    )}
                    {reading.weight && (
                      <div>
                        <span className="text-gray-600">Peso:</span>
                        <span className="ml-1 font-medium">{reading.weight} kg</span>
                      </div>
                    )}
                    {reading.glucose && (
                      <div>
                        <span className="text-gray-600">Glucosa:</span>
                        <span className="ml-1 font-medium">{reading.glucose} mg/dL</span>
                      </div>
                    )}
                    {reading.temperature && (
                      <div>
                        <span className="text-gray-600">Temp:</span>
                        <span className="ml-1 font-medium">{reading.temperature} °C</span>
                      </div>
                    )}
                    {reading.oxygenSaturation && (
                      <div>
                        <span className="text-gray-600">O₂:</span>
                        <span className="ml-1 font-medium">{reading.oxygenSaturation}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
