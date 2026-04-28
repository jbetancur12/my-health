import { useState, useMemo } from 'react';
import { Search, Plus, Filter, FileText, Users, Stethoscope, Calendar as CalendarIcon } from 'lucide-react';
import { AppointmentCard } from './components/AppointmentCard';
import { AppointmentDetail } from './components/AppointmentDetail';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { UpcomingControls } from './components/UpcomingControls';

interface Document {
  id: string;
  type: 'historia_clinica' | 'orden_procedimiento' | 'orden_medicamento' | 'orden_control' | 'laboratorio';
  name: string;
  date: Date;
  file?: File;
  fileUrl?: string;
}

interface Control {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
}

interface Appointment {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  documents: Document[];
  notes?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date('2026-04-15'),
    specialty: 'Cardiología',
    doctor: 'Dr. Juan Pérez',
    documents: [
      { id: 'd1', type: 'historia_clinica', name: 'Historia clínica - Chequeo anual', date: new Date('2026-04-15') },
      { id: 'd2', type: 'orden_procedimiento', name: 'Electrocardiograma', date: new Date('2026-04-15') },
      { id: 'd3', type: 'orden_control', name: 'Control en 6 meses', date: new Date('2026-04-15') }
    ],
    notes: 'Presión arterial normal, seguir con medicación actual'
  },
  {
    id: '2',
    date: new Date('2026-03-20'),
    specialty: 'Medicina General',
    doctor: 'Dra. María González',
    documents: [
      { id: 'd4', type: 'laboratorio', name: 'Exámenes de sangre completos', date: new Date('2026-03-20') },
      { id: 'd5', type: 'orden_medicamento', name: 'Ibuprofeno 400mg', date: new Date('2026-03-20') }
    ],
    notes: 'Revisión de rutina, valores normales'
  },
  {
    id: '3',
    date: new Date('2026-02-10'),
    specialty: 'Oftalmología',
    doctor: 'Dr. Carlos Ramírez',
    documents: [
      { id: 'd6', type: 'historia_clinica', name: 'Examen visual completo', date: new Date('2026-02-10') },
      { id: 'd7', type: 'orden_procedimiento', name: 'Medición de presión ocular', date: new Date('2026-02-10') },
      { id: 'd8', type: 'orden_control', name: 'Control en 12 meses', date: new Date('2026-02-10') }
    ]
  },
  {
    id: '4',
    date: new Date('2026-01-25'),
    specialty: 'Endocrinología',
    doctor: 'Dra. Ana Martínez',
    documents: [
      { id: 'd9', type: 'laboratorio', name: 'Perfil tiroideo', date: new Date('2026-01-25') },
      { id: 'd10', type: 'orden_medicamento', name: 'Levotiroxina 50mcg', date: new Date('2026-01-25') },
      { id: 'd11', type: 'orden_control', name: 'Control en 3 meses', date: new Date('2026-01-25') }
    ],
    notes: 'Ajuste de dosis de tiroides'
  }
];

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'appointments' | 'controls'>('appointments');

  const specialties = useMemo(() => {
    const unique = new Set(appointments.map(a => a.specialty));
    return Array.from(unique).sort();
  }, [appointments]);

  const doctors = useMemo(() => {
    const unique = new Set(appointments.map(a => a.doctor));
    return Array.from(unique).sort();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch =
        searchQuery === '' ||
        apt.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.documents.some(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty = filterSpecialty === 'all' || apt.specialty === filterSpecialty;
      const matchesDoctor = filterDoctor === 'all' || apt.doctor === filterDoctor;
      const matchesDocType = filterDocType === 'all' || apt.documents.some(doc => doc.type === filterDocType);

      return matchesSearch && matchesSpecialty && matchesDoctor && matchesDocType;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, searchQuery, filterSpecialty, filterDoctor, filterDocType]);

  const handleAddAppointment = (newApt: Omit<Appointment, 'id'> & { controls?: Omit<Control, 'id' | 'specialty' | 'doctor' | 'relatedAppointmentId'>[] }) => {
    const appointmentId = Math.random().toString(36).substr(2, 9);
    const appointment: Appointment = {
      date: newApt.date,
      specialty: newApt.specialty,
      doctor: newApt.doctor,
      documents: newApt.documents,
      notes: newApt.notes,
      id: appointmentId
    };
    setAppointments([appointment, ...appointments]);

    if (newApt.controls && newApt.controls.length > 0) {
      const newControls: Control[] = newApt.controls.map(ctrl => ({
        ...ctrl,
        id: Math.random().toString(36).substr(2, 9),
        specialty: newApt.specialty,
        doctor: newApt.doctor,
        relatedAppointmentId: appointmentId
      }));
      setControls([...controls, ...newControls]);
    }

    setShowAddModal(false);
  };

  const handleControlClick = (control: Control) => {
    const relatedAppointment = appointments.find(apt => apt.id === control.relatedAppointmentId);
    if (relatedAppointment) {
      setSelectedAppointment(relatedAppointment);
    }
  };

  const stats = useMemo(() => ({
    totalAppointments: appointments.length,
    totalDocuments: appointments.reduce((sum, apt) => sum + apt.documents.length, 0),
    totalSpecialties: specialties.length
  }), [appointments, specialties]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Archivo Médico Personal</h1>
          <p className="text-gray-600">Gestiona tus citas, documentos y controles médicos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Documentos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Especialidades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSpecialties}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por especialidad, médico o documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Nueva Cita
              </button>
            </div>

            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'appointments'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Historial de Citas
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'controls'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Controles Programados
                {controls.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {controls.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeTab === 'appointments' && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Filtros</span>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Especialidad
                </label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Todas las especialidades</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Médico
                </label>
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Todos los médicos</option>
                  {doctors.map(doctor => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tipo de documento
                </label>
                <select
                  value={filterDocType}
                  onChange={(e) => setFilterDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Todos los documentos</option>
                  <option value="historia_clinica">Historia Clínica</option>
                  <option value="orden_procedimiento">Orden de Procedimiento</option>
                  <option value="orden_medicamento">Orden de Medicamento</option>
                  <option value="orden_control">Orden de Control</option>
                  <option value="laboratorio">Laboratorio</option>
                </select>
              </div>
            </div>
            </div>
          )}

          <div className="p-4">
            {activeTab === 'appointments' ? (
              filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron citas con los filtros aplicados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAppointments.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => setSelectedAppointment(appointment)}
                    />
                  ))}
                </div>
              )
            ) : (
              <UpcomingControls
                controls={controls}
                onControlClick={handleControlClick}
              />
            )}
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {showAddModal && (
        <AddAppointmentModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAppointment}
          existingDoctors={doctors}
          existingSpecialties={specialties}
        />
      )}
    </div>
  );
}