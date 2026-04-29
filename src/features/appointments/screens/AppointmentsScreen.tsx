import type { ReactNode } from 'react';
import { FileText, Filter, Plus, Stethoscope, Users } from 'lucide-react';
import { AdvancedSearch, type SearchFilters } from '../components/AdvancedSearch';
import { AppointmentCard } from '../components/AppointmentCard';
import type { Appointment, AppointmentTag } from '../../../shared/api/contracts';

interface AppointmentStats {
  totalAppointments: number;
  totalDocuments: number;
  totalSpecialties: number;
}

interface AppointmentsScreenProps {
  appointments: Appointment[];
  availableTags: AppointmentTag[];
  doctors: string[];
  specialties: string[];
  filteredAppointments: Appointment[];
  filterDocType: string;
  filterDoctor: string;
  filterSpecialty: string;
  stats: AppointmentStats;
  onAddAppointment: () => void;
  onDoctorFilterChange: (value: string) => void;
  onDocumentTypeFilterChange: (value: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onSearch: (filters: SearchFilters) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSpecialtyFilterChange: (value: string) => void;
}

export function AppointmentsScreen({
  appointments,
  availableTags,
  doctors,
  specialties,
  filteredAppointments,
  filterDocType,
  filterDoctor,
  filterSpecialty,
  stats,
  onAddAppointment,
  onDoctorFilterChange,
  onDocumentTypeFilterChange,
  onEditAppointment,
  onSearch,
  onSelectAppointment,
  onSpecialtyFilterChange,
}: AppointmentsScreenProps) {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={<Stethoscope className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-100"
          label="Total Citas"
          value={stats.totalAppointments}
        />
        <StatCard
          icon={<FileText className="h-6 w-6 text-green-600" />}
          bg="bg-green-100"
          label="Total Documentos"
          value={stats.totalDocuments}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-100"
          label="Especialidades"
          value={stats.totalSpecialties}
        />
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <AdvancedSearch onSearch={onSearch} availableTags={availableTags} />
            </div>

            <button
              onClick={onAddAppointment}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nueva Cita
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SelectFilter
              label="Especialidad"
              value={filterSpecialty}
              onChange={onSpecialtyFilterChange}
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </SelectFilter>

            <SelectFilter label="Médico" value={filterDoctor} onChange={onDoctorFilterChange}>
              <option value="all">Todos los médicos</option>
              {doctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </SelectFilter>

            <SelectFilter
              label="Tipo de documento"
              value={filterDocType}
              onChange={onDocumentTypeFilterChange}
            >
              <option value="all">Todos los documentos</option>
              <option value="historia_clinica">Historia Clínica</option>
              <option value="orden_procedimiento">Orden de Procedimiento</option>
              <option value="orden_medicamento">Orden de Medicamento</option>
              <option value="orden_control">Orden de Control</option>
              <option value="laboratorio">Laboratorio</option>
            </SelectFilter>
          </div>
        </div>

        <div className="p-4">
          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                {appointments.length === 0
                  ? 'No hay citas registradas. Haz clic en "Nueva Cita" para comenzar.'
                  : 'No se encontraron citas con los filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onSelectAppointment(appointment)}
                  onEdit={() => onEditAppointment(appointment)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, bg, label, value }: { icon: ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-3 ${bg}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}
