import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar, Stethoscope, Pill, Syringe, Activity, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'medication' | 'vaccine' | 'vital-sign';
  date: Date;
  title: string;
  subtitle?: string;
  details?: string;
  icon: ReactNode;
  color: string;
  data: any;
}

interface TimelineProps {
  appointments: any[];
  medications: any[];
  vaccines: any[];
  vitalSigns: any[];
  onEventClick?: (event: TimelineEvent) => void;
}

export function Timeline({ appointments, medications, vaccines, vitalSigns, onEventClick }: TimelineProps) {
  const [filterType, setFilterType] = useState<'all' | 'appointment' | 'medication' | 'vaccine' | 'vital-sign'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '6months' | '1year'>('all');

  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    // Appointments
    appointments.forEach(apt => {
      allEvents.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        date: new Date(apt.date),
        title: apt.specialty,
        subtitle: apt.doctor,
        details: `${apt.documents.length} documento${apt.documents.length !== 1 ? 's' : ''}${apt.notes ? ' • ' + apt.notes.substring(0, 50) : ''}`,
        icon: <Stethoscope className="w-5 h-5" />,
        color: 'blue',
        data: apt
      });
    });

    // Medications (start dates)
    medications.forEach(med => {
      allEvents.push({
        id: `med-${med.id}`,
        type: 'medication',
        date: new Date(med.startDate),
        title: med.name,
        subtitle: `${med.dosage} • ${med.frequency}`,
        details: med.active ? 'Activo' : 'Inactivo',
        icon: <Pill className="w-5 h-5" />,
        color: 'green',
        data: med
      });
    });

    // Vaccines
    vaccines.forEach(vac => {
      allEvents.push({
        id: `vac-${vac.id}`,
        type: 'vaccine',
        date: new Date(vac.date),
        title: vac.name,
        subtitle: vac.doseNumber && vac.totalDoses ? `Dosis ${vac.doseNumber}/${vac.totalDoses}` : undefined,
        details: vac.location,
        icon: <Syringe className="w-5 h-5" />,
        color: 'purple',
        data: vac
      });
    });

    // Vital Signs
    vitalSigns.forEach(vs => {
      const vitals = [];
      if (vs.bloodPressureSystolic) vitals.push(`PA: ${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}`);
      if (vs.weight) vitals.push(`Peso: ${vs.weight}kg`);
      if (vs.glucose) vitals.push(`Glucosa: ${vs.glucose}mg/dL`);

      allEvents.push({
        id: `vs-${vs.id}`,
        type: 'vital-sign',
        date: new Date(vs.date),
        title: 'Signos Vitales',
        subtitle: vitals.join(' • '),
        details: vs.notes,
        icon: <Activity className="w-5 h-5" />,
        color: 'orange',
        data: vs
      });
    });

    // Sort by date (most recent first)
    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, medications, vaccines, vitalSigns]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      if (dateRange === '30days') {
        cutoffDate.setDate(now.getDate() - 30);
      } else if (dateRange === '6months') {
        cutoffDate.setMonth(now.getMonth() - 6);
      } else if (dateRange === '1year') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter(e => e.date >= cutoffDate);
    }

    return filtered;
  }, [events, filterType, dateRange]);

  // Group by month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};

    filteredEvents.forEach(event => {
      const monthKey = format(event.date, 'MMMM yyyy', { locale: es });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });

    return groups;
  }, [filteredEvents]);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Calendar className="w-7 h-7 text-blue-600" />
          Línea de Tiempo Médica
        </h2>
        <p className="text-gray-600">Toda tu historia médica en orden cronológico</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('appointment')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'appointment'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Stethoscope className="w-4 h-4 inline mr-1" />
                Citas
              </button>
              <button
                onClick={() => setFilterType('medication')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'medication'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Pill className="w-4 h-4 inline mr-1" />
                Medicamentos
              </button>
              <button
                onClick={() => setFilterType('vaccine')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'vaccine'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Syringe className="w-4 h-4 inline mr-1" />
                Vacunas
              </button>
              <button
                onClick={() => setFilterType('vital-sign')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'vital-sign'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-1" />
                Signos
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todo el historial</option>
              <option value="30days">Últimos 30 días</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="1year">Último año</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Mostrando {filteredEvents.length} de {events.length} eventos
        </div>
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay eventos en el período seleccionado</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="sticky top-0 bg-gray-50 z-10 py-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{monthKey}</h3>
              </div>

              <div className="space-y-4 relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {monthEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="relative pl-16 cursor-pointer group"
                  >
                    {/* Icon */}
                    <div className={`absolute left-2 w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[event.color as keyof typeof colorClasses]} border-2`}>
                      {event.icon}
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          {event.subtitle && (
                            <p className="text-sm text-gray-600 mt-1">{event.subtitle}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {format(event.date, "d 'de' MMM", { locale: es })}
                        </span>
                      </div>
                      {event.details && (
                        <p className="text-sm text-gray-500">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
