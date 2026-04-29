import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Search, X, Stethoscope, Pill, Syringe, Activity, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  Appointment,
  MedicalProfile,
  Medication,
  Vaccine,
  VitalSignReading,
} from '../../../shared/api/contracts';

type SearchResultData = Appointment | Medication | Vaccine | VitalSignReading | MedicalProfile;

interface SearchResult {
  id: string;
  type: 'appointment' | 'medication' | 'vaccine' | 'vital-sign' | 'profile';
  title: string;
  subtitle: string;
  date?: Date;
  icon: ReactNode;
  color: string;
  matchedField: string;
  data: SearchResultData;
}

interface GlobalSearchProps {
  appointments: Appointment[];
  medications: Medication[];
  vaccines: Vaccine[];
  vitalSigns: VitalSignReading[];
  medicalProfile: MedicalProfile;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({
  appointments,
  medications,
  vaccines,
  vitalSigns,
  medicalProfile,
  onResultClick,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search in appointments
    appointments.forEach((apt) => {
      const matches = [];

      if (apt.specialty.toLowerCase().includes(searchTerm)) {
        matches.push('especialidad');
      }
      if (apt.doctor.toLowerCase().includes(searchTerm)) {
        matches.push('médico');
      }
      if (apt.notes?.toLowerCase().includes(searchTerm)) {
        matches.push('notas');
      }
      apt.documents.forEach((doc) => {
        if (doc.name.toLowerCase().includes(searchTerm)) {
          matches.push('documento');
        }
      });

      if (matches.length > 0) {
        allResults.push({
          id: `apt-${apt.id}`,
          type: 'appointment',
          title: apt.specialty,
          subtitle: apt.doctor,
          date: new Date(apt.date),
          icon: <Stethoscope className="w-5 h-5" />,
          color: 'blue',
          matchedField: `Coincide en: ${matches.join(', ')}`,
          data: apt,
        });
      }
    });

    // Search in medications
    medications.forEach((med) => {
      if (
        med.name.toLowerCase().includes(searchTerm) ||
        med.dosage?.toLowerCase().includes(searchTerm) ||
        med.frequency?.toLowerCase().includes(searchTerm) ||
        med.notes?.toLowerCase().includes(searchTerm)
      ) {
        allResults.push({
          id: `med-${med.id}`,
          type: 'medication',
          title: med.name,
          subtitle: `${med.dosage} • ${med.frequency}`,
          date: new Date(med.startDate),
          icon: <Pill className="w-5 h-5" />,
          color: 'green',
          matchedField: med.active ? 'Activo' : 'Inactivo',
          data: med,
        });
      }
    });

    // Search in vaccines
    vaccines.forEach((vac) => {
      if (
        vac.name.toLowerCase().includes(searchTerm) ||
        vac.location?.toLowerCase().includes(searchTerm) ||
        vac.notes?.toLowerCase().includes(searchTerm)
      ) {
        allResults.push({
          id: `vac-${vac.id}`,
          type: 'vaccine',
          title: vac.name,
          subtitle: vac.location || 'Vacuna',
          date: new Date(vac.date),
          icon: <Syringe className="w-5 h-5" />,
          color: 'purple',
          matchedField: vac.doseNumber ? `Dosis ${vac.doseNumber}/${vac.totalDoses}` : 'Vacuna',
          data: vac,
        });
      }
    });

    // Search in vital signs
    vitalSigns.forEach((vs) => {
      if (vs.notes?.toLowerCase().includes(searchTerm)) {
        const vitals = [];
        if (vs.bloodPressureSystolic)
          vitals.push(`${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}`);
        if (vs.weight) vitals.push(`${vs.weight}kg`);

        allResults.push({
          id: `vs-${vs.id}`,
          type: 'vital-sign',
          title: 'Signos Vitales',
          subtitle: vitals.join(' • '),
          date: new Date(vs.date),
          icon: <Activity className="w-5 h-5" />,
          color: 'orange',
          matchedField: 'Coincide en notas',
          data: vs,
        });
      }
    });

    // Search in medical profile
    if (medicalProfile) {
      const profileMatches = [];

      medicalProfile.allergies?.forEach((allergy) => {
        if (allergy.toLowerCase().includes(searchTerm)) {
          profileMatches.push(`Alergia: ${allergy}`);
        }
      });

      medicalProfile.chronicConditions?.forEach((condition) => {
        if (condition.toLowerCase().includes(searchTerm)) {
          profileMatches.push(`Condición: ${condition}`);
        }
      });

      if (medicalProfile.bloodType?.toLowerCase().includes(searchTerm)) {
        profileMatches.push(`Tipo de sangre: ${medicalProfile.bloodType}`);
      }

      if (profileMatches.length > 0) {
        allResults.push({
          id: 'profile',
          type: 'profile',
          title: 'Perfil Médico Personal',
          subtitle: profileMatches.join(' • '),
          icon: <User className="w-5 h-5" />,
          color: 'gray',
          matchedField: `${profileMatches.length} coincidencia${profileMatches.length !== 1 ? 's' : ''}`,
          data: medicalProfile,
        });
      }
    }

    // Sort by date (most recent first), except profile
    return allResults.sort((a, b) => {
      if (a.type === 'profile') return 1;
      if (b.type === 'profile') return -1;
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    });
  }, [query, appointments, medications, vaccines, vitalSigns, medicalProfile]);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Search className="w-7 h-7 text-blue-600" />
          Búsqueda Global
        </h2>
        <p className="text-gray-600">Busca en todo tu historial médico</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar especialidad, médico, medicamento, vacuna, síntoma..."
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Quick search suggestions */}
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Prueba buscar:</span>
            <button
              onClick={() => setQuery('cardiología')}
              className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
            >
              cardiología
            </button>
            <button
              onClick={() => setQuery('diabetes')}
              className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
            >
              diabetes
            </button>
            <button
              onClick={() => setQuery('covid')}
              className="text-sm px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
            >
              covid
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {query && isOpen && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado
                {results.length !== 1 ? 's' : ''}
              </span>
              {results.length > 0 && (
                <span className="text-sm text-gray-500">Click para ver detalles</span>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron resultados para "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onResultClick?.(result);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${colorClasses[result.color as keyof typeof colorClasses]}`}
                      >
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                            <p className="text-sm text-gray-600 truncate mt-1">{result.subtitle}</p>
                            <p className="text-xs text-gray-500 mt-1">{result.matchedField}</p>
                          </div>
                          {result.date && (
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {format(result.date, 'd MMM yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats when no search */}
      {!query && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">{appointments.length}</span>
            </div>
            <p className="text-sm text-blue-700">Citas</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">{medications.length}</span>
            </div>
            <p className="text-sm text-green-700">Medicamentos</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Syringe className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">{vaccines.length}</span>
            </div>
            <p className="text-sm text-purple-700">Vacunas</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-900">{vitalSigns.length}</span>
            </div>
            <p className="text-sm text-orange-700">Registros Vitales</p>
          </div>
        </div>
      )}
    </div>
  );
}
