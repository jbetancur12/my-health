import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Plus,
  Filter,
  FileText,
  Users,
  Stethoscope,
  Calendar as CalendarIcon,
  BarChart3,
  Pill,
  Download,
  Bell,
} from 'lucide-react';
import { AppointmentCard } from './components/AppointmentCard';
import { AppointmentDetail } from './components/AppointmentDetail';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { UpcomingControls } from './components/UpcomingControls';
import { Dashboard } from './components/Dashboard';
import { MedicationManager, Medication } from './components/MedicationManager';
import { ControlAlerts } from './components/ControlAlerts';
import { ExportData } from './components/ExportData';
import { CalendarView } from './components/CalendarView';
import { AppointmentTag } from './components/TagManager';
import { AdvancedSearch, SearchFilters } from './components/AdvancedSearch';
import { PDFViewer } from './components/PDFViewer';
import { NotificationSettings, NotificationPreferences } from './components/NotificationSettings';
import * as api from '../utils/api';

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
  tags?: string[];
}

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'appointments' | 'controls' | 'medications' | 'calendar' | 'settings' | 'export'
  >('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [tags, setTags] = useState<AppointmentTag[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '', tags: [] });
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string } | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: '',
    phone: '',
    emailEnabled: false,
    smsEnabled: false,
    reminderDays: [7, 3, 1],
  });

  useEffect(() => {
    loadData();

    const savedTags = localStorage.getItem('tags');
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    }

    const savedPrefs = localStorage.getItem('notificationPrefs');
    if (savedPrefs) {
      setNotificationPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [appointmentsData, controlsData, medicationsData] = await Promise.all([
        api.getAppointments(),
        api.getControls(),
        api.getMedications(),
      ]);

      setAppointments(appointmentsData);
      setControls(controlsData);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading data from backend:', error);

      const localMeds = localStorage.getItem('medications');
      if (localMeds) {
        setMedications(JSON.parse(localMeds));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const specialties = useMemo(() => {
    const specialtyMap = new Map<string, string>();
    appointments.forEach((appointment) => {
      const lower = appointment.specialty.toLowerCase();
      if (!specialtyMap.has(lower)) {
        specialtyMap.set(lower, appointment.specialty);
      }
    });
    return Array.from(specialtyMap.values()).sort();
  }, [appointments]);

  const doctors = useMemo(() => {
    const doctorMap = new Map<string, string>();
    appointments.forEach((appointment) => {
      const lower = appointment.doctor.toLowerCase();
      if (!doctorMap.has(lower)) {
        doctorMap.set(lower, appointment.doctor);
      }
    });
    return Array.from(doctorMap.values()).sort();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const textQuery = searchFilters.query;
        const matchesSearch =
          textQuery === '' ||
          appointment.specialty.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.doctor.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.notes?.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.documents.some((document) => document.name.toLowerCase().includes(textQuery.toLowerCase()));

        const matchesDateFrom = !searchFilters.dateFrom || new Date(appointment.date) >= searchFilters.dateFrom;
        const matchesDateTo = !searchFilters.dateTo || new Date(appointment.date) <= searchFilters.dateTo;
        const matchesTags =
          searchFilters.tags.length === 0 ||
          (appointment.tags && searchFilters.tags.some((tag) => appointment.tags?.includes(tag)));

        const matchesSpecialty = filterSpecialty === 'all' || appointment.specialty === filterSpecialty;
        const matchesDoctor = filterDoctor === 'all' || appointment.doctor === filterDoctor;
        const matchesDocType =
          filterDocType === 'all' || appointment.documents.some((document) => document.type === filterDocType);

        return (
          matchesSearch &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesTags &&
          matchesSpecialty &&
          matchesDoctor &&
          matchesDocType
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, searchFilters, filterSpecialty, filterDoctor, filterDocType]);

  const handleAddAppointment = async (
    newAppointment: Omit<Appointment, 'id'> & {
      id?: string;
      controls?: Omit<Control, 'id' | 'specialty' | 'doctor' | 'relatedAppointmentId'>[];
    },
  ) => {
    try {
      const documentsWithoutFiles = newAppointment.documents.map((document) => ({
        id: document.id,
        type: document.type,
        name: document.name,
        date: document.date,
      }));

      let savedAppointment: Appointment;

      if (newAppointment.id) {
        savedAppointment = await api.updateAppointment(newAppointment.id, {
          date: newAppointment.date,
          specialty: newAppointment.specialty,
          doctor: newAppointment.doctor,
          documents: documentsWithoutFiles,
          notes: newAppointment.notes,
          tags: newAppointment.tags,
        });

        for (const document of newAppointment.documents) {
          if (document.file) {
            const fileUrl = await api.uploadFile(document.file, savedAppointment.id, document.id);
            const docIndex = savedAppointment.documents.findIndex((item) => item.id === document.id);
            if (docIndex !== -1) {
              savedAppointment.documents[docIndex].fileUrl = fileUrl;
            }
          }
        }

        setAppointments(appointments.map((appointment) => (
          appointment.id === savedAppointment.id ? savedAppointment : appointment
        )));
      } else {
        savedAppointment = await api.saveAppointment({
          date: newAppointment.date,
          specialty: newAppointment.specialty,
          doctor: newAppointment.doctor,
          documents: documentsWithoutFiles,
          notes: newAppointment.notes,
          tags: newAppointment.tags,
        });

        for (const document of newAppointment.documents) {
          if (document.file) {
            const fileUrl = await api.uploadFile(document.file, savedAppointment.id, document.id);
            const docIndex = savedAppointment.documents.findIndex((item) => item.id === document.id);
            if (docIndex !== -1) {
              savedAppointment.documents[docIndex].fileUrl = fileUrl;
            }
          }
        }

        setAppointments([savedAppointment, ...appointments]);

        if (newAppointment.controls && newAppointment.controls.length > 0) {
          const savedControls: Control[] = [];
          for (const control of newAppointment.controls) {
            const savedControl = await api.saveControl({
              date: control.date,
              type: control.type,
              specialty: newAppointment.specialty,
              doctor: newAppointment.doctor,
              relatedAppointmentId: savedAppointment.id,
            });
            savedControls.push(savedControl);
          }
          setControls([...controls, ...savedControls]);
        }
      }

      setShowAddModal(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error('Error saving appointment to backend:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAddModal(true);
  };

  const handleAddMedication = async (medication: Omit<Medication, 'id'>) => {
    const savedMedication = await api.saveMedication(medication);
    const updated = [...medications, savedMedication];
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
  };

  const handleRemoveMedication = async (id: string) => {
    await api.deleteMedication(id);
    const updated = medications.filter((medication) => medication.id !== id);
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
  };

  const handleToggleMedication = async (id: string) => {
    const medication = medications.find((item) => item.id === id);
    if (!medication) return;

    const updatedMedication = { ...medication, active: !medication.active };
    const savedMedication = await api.updateMedication(id, updatedMedication);
    const updated = medications.map((item) => (item.id === id ? savedMedication : item));
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
  };

  const handleCreateTag = (tag: Omit<AppointmentTag, 'id'>) => {
    const newTag: AppointmentTag = { ...tag, id: crypto.randomUUID() };
    const updated = [...tags, newTag];
    setTags(updated);
    localStorage.setItem('tags', JSON.stringify(updated));
  };

  const handleUpdateNotificationPrefs = (prefs: NotificationPreferences) => {
    setNotificationPrefs(prefs);
    localStorage.setItem('notificationPrefs', JSON.stringify(prefs));
  };

  const handleControlClick = (control: Control) => {
    const relatedAppointment = appointments.find((appointment) => appointment.id === control.relatedAppointmentId);
    if (relatedAppointment) {
      setSelectedAppointment(relatedAppointment);
    }
  };

  const stats = useMemo(() => ({
    totalAppointments: appointments.length,
    totalDocuments: appointments.reduce((sum, appointment) => sum + appointment.documents.length, 0),
    totalSpecialties: specialties.length,
  }), [appointments, specialties]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Archivo Médico Personal</h1>
              <p className="text-gray-600">Gestiona tus citas, documentos y controles médicos</p>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <TabButton icon={<BarChart3 className="w-4 h-4" />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" />
            <TabButton icon={<Stethoscope className="w-4 h-4" />} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} label="Citas Médicas" />
            <TabButton
              icon={<CalendarIcon className="w-4 h-4" />}
              active={activeTab === 'controls'}
              onClick={() => setActiveTab('controls')}
              label={`Controles Programados${controls.length > 0 ? ` (${controls.length})` : ''}`}
            />
            <TabButton icon={<Pill className="w-4 h-4" />} active={activeTab === 'medications'} onClick={() => setActiveTab('medications')} label="Medicamentos" />
            <TabButton icon={<CalendarIcon className="w-4 h-4" />} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Calendario" />
            <TabButton icon={<Bell className="w-4 h-4" />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Configuración" />
            <TabButton icon={<Download className="w-4 h-4" />} active={activeTab === 'export'} onClick={() => setActiveTab('export')} label="Exportar" />
          </div>
        </div>

        <ControlAlerts controls={controls} onControlClick={handleControlClick} />

        {activeTab === 'dashboard' && <Dashboard appointments={appointments} medications={medications} />}

        {activeTab === 'medications' && (
          <MedicationManager
            medications={medications}
            onAdd={handleAddMedication}
            onRemove={handleRemoveMedication}
            onToggle={handleToggleMedication}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            appointments={appointments}
            controls={controls}
            onAppointmentClick={setSelectedAppointment}
            onControlClick={handleControlClick}
          />
        )}

        {activeTab === 'settings' && (
          <NotificationSettings preferences={notificationPrefs} onUpdate={handleUpdateNotificationPrefs} />
        )}

        {activeTab === 'export' && (
          <ExportData
            data={{ appointments, controls, medications, tags }}
            filename={`archivo-medico-${new Date().toISOString().split('T')[0]}`}
          />
        )}

        {activeTab === 'appointments' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard icon={<Stethoscope className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" label="Total Citas" value={stats.totalAppointments} />
              <StatCard icon={<FileText className="w-6 h-6 text-green-600" />} bg="bg-green-100" label="Total Documentos" value={stats.totalDocuments} />
              <StatCard icon={<Users className="w-6 h-6 text-purple-600" />} bg="bg-purple-100" label="Especialidades" value={stats.totalSpecialties} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <AdvancedSearch onSearch={setSearchFilters} availableTags={tags} />
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Cita
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Filtros</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SelectFilter label="Especialidad" value={filterSpecialty} onChange={setFilterSpecialty}>
                    <option value="all">Todas las especialidades</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </SelectFilter>

                  <SelectFilter label="Médico" value={filterDoctor} onChange={setFilterDoctor}>
                    <option value="all">Todos los médicos</option>
                    {doctors.map((doctor) => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </SelectFilter>

                  <SelectFilter label="Tipo de documento" value={filterDocType} onChange={setFilterDocType}>
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
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-3"></div>
                    <p className="text-gray-500">Cargando datos...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {appointments.length === 0
                        ? 'No hay citas registradas. Haz clic en "Nueva Cita" para comenzar.'
                        : 'No se encontraron citas con los filtros aplicados'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => setSelectedAppointment(appointment)}
                        onEdit={() => handleEditAppointment(appointment)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'controls' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <UpcomingControls controls={controls} onControlClick={handleControlClick} />
          </div>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          tags={tags}
          onViewFile={(url, name) => setPdfViewer({ url, name })}
        />
      )}

      {showAddModal && (
        <AddAppointmentModal
          onClose={() => {
            setShowAddModal(false);
            setEditingAppointment(null);
          }}
          onAdd={handleAddAppointment}
          existingDoctors={doctors}
          existingSpecialties={specialties}
          editingAppointment={editingAppointment || undefined}
          availableTags={tags}
          onCreateTag={handleCreateTag}
        />
      )}

      {pdfViewer && (
        <PDFViewer fileUrl={pdfViewer.url} fileName={pdfViewer.name} onClose={() => setPdfViewer(null)} />
      )}
    </div>
  );
}

function TabButton({
  icon,
  active,
  onClick,
  label,
}: {
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
        active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, bg, label, value }: { icon: ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
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
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {children}
      </select>
    </div>
  );
}
