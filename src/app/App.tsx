import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  Calendar as CalendarIcon,
  Clock,
  Download,
  FileText,
  Filter,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Syringe,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { AdvancedSearch, type SearchFilters } from './components/AdvancedSearch';
import { AppointmentCard } from './components/AppointmentCard';
import { ControlAlerts } from './components/ControlAlerts';
import { ExportData } from './components/ExportData';
import { InstallPrompt } from './components/InstallPrompt';
import { MedicalProfile, type MedicalProfileData } from './components/MedicalProfile';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileOptimization } from './components/MobileOptimization';
import { type AppointmentTag as UiAppointmentTag } from './components/TagManager';
import { UpcomingControls } from './components/UpcomingControls';
import * as api from '../utils/api';
import { checkAndShowReminders } from '../utils/notifications';
import type {
  Appointment,
  Control,
  MedicalProfile as ApiMedicalProfile,
  Medication,
  NotificationPreferences as ApiNotificationPreferences,
  Vaccine,
  VitalSignReading,
} from '../utils/api';

const Dashboard = lazy(async () => {
  const module = await import('./components/Dashboard');
  return { default: module.Dashboard };
});

const AddAppointmentModal = lazy(async () => {
  const module = await import('./components/AddAppointmentModal');
  return { default: module.AddAppointmentModal };
});

const AppointmentDetail = lazy(async () => {
  const module = await import('./components/AppointmentDetail');
  return { default: module.AppointmentDetail };
});

const MedicationManager = lazy(async () => {
  const module = await import('./components/MedicationManager');
  return { default: module.MedicationManager };
});

const CalendarView = lazy(async () => {
  const module = await import('./components/CalendarView');
  return { default: module.CalendarView };
});

const NotificationSettings = lazy(async () => {
  const module = await import('./components/NotificationSettings');
  return { default: module.NotificationSettings };
});

const ImportData = lazy(async () => {
  const module = await import('./components/ImportData');
  return { default: module.ImportData };
});

const VitalSigns = lazy(async () => {
  const module = await import('./components/VitalSigns');
  return { default: module.VitalSigns };
});

const VaccineHistory = lazy(async () => {
  const module = await import('./components/VaccineHistory');
  return { default: module.VaccineHistory };
});

const Timeline = lazy(async () => {
  const module = await import('./components/Timeline');
  return { default: module.Timeline };
});

const GlobalSearch = lazy(async () => {
  const module = await import('./components/GlobalSearch');
  return { default: module.GlobalSearch };
});

const MedicalCalculators = lazy(async () => {
  const module = await import('./components/MedicalCalculators');
  return { default: module.MedicalCalculators };
});

const PDFReport = lazy(async () => {
  const module = await import('./components/PDFReport');
  return { default: module.PDFReport };
});

const PDFViewer = lazy(async () => {
  const module = await import('./components/PDFViewer');
  return { default: module.PDFViewer };
});

type AppTab =
  | 'appointments'
  | 'calendar'
  | 'calculators'
  | 'controls'
  | 'dashboard'
  | 'export'
  | 'import'
  | 'medications'
  | 'pdf'
  | 'profile'
  | 'search'
  | 'settings'
  | 'timeline'
  | 'vaccines'
  | 'vitals';

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [tags, setTags] = useState<UiAppointmentTag[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '', tags: [] });
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string } | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<ApiNotificationPreferences>({
    email: '',
    phone: '',
    emailEnabled: false,
    smsEnabled: false,
    reminderDays: [7, 3, 1],
  });
  const [medicalProfile, setMedicalProfile] = useState<ApiMedicalProfile>({
    allergies: [],
    chronicConditions: [],
    emergencyContacts: [],
  });
  const [vitalSigns, setVitalSigns] = useState<VitalSignReading[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      (appointments.length === 0 && vaccines.length === 0 && controls.length === 0)
    ) {
      return;
    }

    const checkReminders = () => {
      checkAndShowReminders(appointments, medications, vaccines, controls, notificationPrefs.reminderDays);
    };

    checkReminders();

    const interval = window.setInterval(checkReminders, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [appointments, controls, medications, notificationPrefs.reminderDays, vaccines]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [
        appointmentsData,
        controlsData,
        medicationsData,
        tagsData,
        medicalProfileData,
        notificationPreferencesData,
        vitalSignsData,
        vaccinesData,
      ] = await Promise.all([
        api.getAppointments(),
        api.getControls(),
        api.getMedications(),
        api.getTags(),
        api.getMedicalProfile(),
        api.getNotificationPreferences(),
        api.getVitalSigns(),
        api.getVaccines(),
      ]);

      setAppointments(appointmentsData);
      setControls(controlsData);
      setMedications(medicationsData);
      setTags(tagsData);
      setMedicalProfile(medicalProfileData);
      setNotificationPrefs(notificationPreferencesData);
      setVitalSigns(vitalSignsData);
      setVaccines(vaccinesData);
    } catch (error) {
      console.error('Error loading data from backend:', error);
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
  }, [appointments, filterDocType, filterDoctor, filterSpecialty, searchFilters]);

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

        setAppointments((current) =>
          current.map((appointment) => (appointment.id === savedAppointment.id ? savedAppointment : appointment)),
        );
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

        setAppointments((current) => [savedAppointment, ...current]);

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
          setControls((current) => [...current, ...savedControls]);
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
    setMedications((current) => [...current, savedMedication]);
  };

  const handleRemoveMedication = async (id: string) => {
    await api.deleteMedication(id);
    setMedications((current) => current.filter((medication) => medication.id !== id));
  };

  const handleToggleMedication = async (id: string) => {
    const medication = medications.find((item) => item.id === id);
    if (!medication) return;

    const updatedMedication = { ...medication, active: !medication.active };
    const savedMedication = await api.updateMedication(id, updatedMedication);
    setMedications((current) => current.map((item) => (item.id === id ? savedMedication : item)));
  };

  const handleCreateTag = async (tag: Omit<UiAppointmentTag, 'id'>) => {
    const savedTag = await api.saveTag(tag);
    setTags((current) => [...current, savedTag]);
  };

  const handleUpdateNotificationPrefs = async (prefs: ApiNotificationPreferences) => {
    const savedPrefs = await api.saveNotificationPreferences(prefs);
    setNotificationPrefs(savedPrefs);
  };

  const handleUpdateMedicalProfile = async (profile: MedicalProfileData) => {
    const savedProfile = await api.saveMedicalProfile(profile);
    setMedicalProfile(savedProfile);
  };

  const handleAddVitalSign = async (reading: Omit<VitalSignReading, 'id'>) => {
    const savedReading = await api.saveVitalSign(reading);
    setVitalSigns((current) => [savedReading, ...current]);
  };

  const handleRemoveVitalSign = async (id: string) => {
    await api.deleteVitalSign(id);
    setVitalSigns((current) => current.filter((reading) => reading.id !== id));
  };

  const handleAddVaccine = async (vaccine: Omit<Vaccine, 'id'>) => {
    const savedVaccine = await api.saveVaccine(vaccine);
    setVaccines((current) => [savedVaccine, ...current]);
  };

  const handleRemoveVaccine = async (id: string) => {
    await api.deleteVaccine(id);
    setVaccines((current) => current.filter((vaccine) => vaccine.id !== id));
  };

  const handleImportData = async (data: {
    appointments?: Appointment[];
    controls?: Control[];
    medications?: Medication[];
    tags?: UiAppointmentTag[];
    medicalProfile?: MedicalProfileData;
    notificationPreferences?: ApiNotificationPreferences;
    vitalSigns?: VitalSignReading[];
    vaccines?: Vaccine[];
  }) => {
    const imported = await api.importAppData(data);
    setAppointments(imported.appointments);
    setControls(imported.controls);
    setMedications(imported.medications);
    setTags(imported.tags);
    setMedicalProfile(imported.medicalProfile);
    setNotificationPrefs(imported.notificationPreferences);
    setVitalSigns(imported.vitalSigns);
    setVaccines(imported.vaccines);
  };

  const handleControlClick = (control: Control) => {
    const relatedAppointment = appointments.find((appointment) => appointment.id === control.relatedAppointmentId);
    if (relatedAppointment) {
      setSelectedAppointment(relatedAppointment);
      setActiveTab('appointments');
    }
  };

  const handleTimelineEventClick = (event: { type: string; data: unknown }) => {
    if (event.type === 'appointment') {
      setSelectedAppointment(event.data as Appointment);
      setActiveTab('appointments');
      return;
    }

    if (event.type === 'medication') {
      setActiveTab('medications');
      return;
    }

    if (event.type === 'vaccine') {
      setActiveTab('vaccines');
      return;
    }

    if (event.type === 'vital-sign') {
      setActiveTab('vitals');
    }
  };

  const handleGlobalSearchResultClick = (result: { type: string; data: unknown }) => {
    if (result.type === 'appointment') {
      setSelectedAppointment(result.data as Appointment);
      setActiveTab('appointments');
      return;
    }

    if (result.type === 'medication') {
      setActiveTab('medications');
      return;
    }

    if (result.type === 'vaccine') {
      setActiveTab('vaccines');
      return;
    }

    if (result.type === 'vital-sign') {
      setActiveTab('vitals');
      return;
    }

    if (result.type === 'profile') {
      setActiveTab('profile');
    }
  };

  const stats = useMemo(
    () => ({
      totalAppointments: appointments.length,
      totalDocuments: appointments.reduce((sum, appointment) => sum + appointment.documents.length, 0),
      totalSpecialties: specialties.length,
    }),
    [appointments, specialties],
  );

  const exportPayload = useMemo(
    () => ({
      appointments,
      controls,
      medications,
      tags,
      medicalProfile,
      notificationPreferences: notificationPrefs,
      vitalSigns,
      vaccines,
    }),
    [appointments, controls, medications, medicalProfile, notificationPrefs, tags, vaccines, vitalSigns],
  );

  return (
    <>
      <MobileOptimization />

      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-8">
          <div className="mb-4 md:mb-6">
            <div className="mb-3 flex items-center justify-between md:mb-4">
              <div className="flex-1 pr-12 md:pr-0">
                <h1 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-3xl">Mi Salud</h1>
                <p className="hidden text-xs text-gray-600 md:block md:text-base">
                  Gestiona tus citas, documentos, controles y seguimiento médico desde un solo lugar
                </p>
              </div>
            </div>

            <div className="hidden gap-2 overflow-x-auto border-b border-gray-200 md:flex">
              <TabButton icon={<BarChart3 className="h-4 w-4" />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" />
              <TabButton icon={<Stethoscope className="h-4 w-4" />} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} label="Citas Médicas" />
              <TabButton
                icon={<CalendarIcon className="h-4 w-4" />}
                active={activeTab === 'controls'}
                onClick={() => setActiveTab('controls')}
                label={`Controles${controls.length > 0 ? ` (${controls.length})` : ''}`}
              />
              <TabButton icon={<Pill className="h-4 w-4" />} active={activeTab === 'medications'} onClick={() => setActiveTab('medications')} label="Medicamentos" />
              <TabButton icon={<CalendarIcon className="h-4 w-4" />} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Calendario" />
              <TabButton icon={<Bell className="h-4 w-4" />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Configuración" />
              <TabButton icon={<Download className="h-4 w-4" />} active={activeTab === 'export'} onClick={() => setActiveTab('export')} label="Exportar" />
              <TabButton icon={<Upload className="h-4 w-4" />} active={activeTab === 'import'} onClick={() => setActiveTab('import')} label="Importar" />
              <TabButton icon={<User className="h-4 w-4" />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Perfil Médico" />
              <TabButton icon={<Activity className="h-4 w-4" />} active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')} label="Signos Vitales" />
              <TabButton icon={<Syringe className="h-4 w-4" />} active={activeTab === 'vaccines'} onClick={() => setActiveTab('vaccines')} label="Vacunas" />
              <TabButton icon={<Clock className="h-4 w-4" />} active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} label="Timeline" />
              <TabButton icon={<Search className="h-4 w-4" />} active={activeTab === 'search'} onClick={() => setActiveTab('search')} label="Buscar" />
              <TabButton icon={<Calculator className="h-4 w-4" />} active={activeTab === 'calculators'} onClick={() => setActiveTab('calculators')} label="Calculadoras" />
              <TabButton icon={<FileText className="h-4 w-4" />} active={activeTab === 'pdf'} onClick={() => setActiveTab('pdf')} label="Generar PDF" />
            </div>
          </div>

          <ControlAlerts controls={controls} onControlClick={handleControlClick} />

          {activeTab === 'dashboard' && (
            <LazySection>
              <Dashboard appointments={appointments} medications={medications} />
            </LazySection>
          )}

          {activeTab === 'medications' && (
            <LazySection>
              <MedicationManager
                medications={medications}
                onAdd={handleAddMedication}
                onRemove={handleRemoveMedication}
                onToggle={handleToggleMedication}
              />
            </LazySection>
          )}

          {activeTab === 'calendar' && (
            <LazySection>
              <CalendarView
                appointments={appointments}
                controls={controls}
                onAppointmentClick={setSelectedAppointment}
                onControlClick={handleControlClick}
              />
            </LazySection>
          )}

          {activeTab === 'settings' && (
            <LazySection>
              <NotificationSettings preferences={notificationPrefs} onUpdate={handleUpdateNotificationPrefs} />
            </LazySection>
          )}

          {activeTab === 'export' && (
            <ExportData data={exportPayload} filename={`archivo-medico-${new Date().toISOString().split('T')[0]}`} />
          )}

          {activeTab === 'import' && (
            <LazySection>
              <ImportData onImport={handleImportData} />
            </LazySection>
          )}

          {activeTab === 'profile' && (
            <MedicalProfile profile={medicalProfile} onUpdate={handleUpdateMedicalProfile} />
          )}

          {activeTab === 'vitals' && (
            <LazySection>
              <VitalSigns readings={vitalSigns} onAdd={handleAddVitalSign} onRemove={handleRemoveVitalSign} />
            </LazySection>
          )}

          {activeTab === 'vaccines' && (
            <LazySection>
              <VaccineHistory vaccines={vaccines} onAdd={handleAddVaccine} onRemove={handleRemoveVaccine} />
            </LazySection>
          )}

          {activeTab === 'timeline' && (
            <LazySection>
              <Timeline
                appointments={appointments}
                medications={medications}
                vaccines={vaccines}
                vitalSigns={vitalSigns}
                onEventClick={handleTimelineEventClick}
              />
            </LazySection>
          )}

          {activeTab === 'search' && (
            <LazySection>
              <GlobalSearch
                appointments={appointments}
                medications={medications}
                vaccines={vaccines}
                vitalSigns={vitalSigns}
                medicalProfile={medicalProfile}
                onResultClick={handleGlobalSearchResultClick}
              />
            </LazySection>
          )}

          {activeTab === 'calculators' && (
            <LazySection>
              <MedicalCalculators />
            </LazySection>
          )}

          {activeTab === 'pdf' && (
            <LazySection>
              <PDFReport
                appointments={appointments}
                medications={medications}
                vaccines={vaccines}
                vitalSigns={vitalSigns}
                medicalProfile={medicalProfile}
                controls={controls}
              />
            </LazySection>
          )}

          {activeTab === 'appointments' && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard icon={<Stethoscope className="h-6 w-6 text-blue-600" />} bg="bg-blue-100" label="Total Citas" value={stats.totalAppointments} />
                <StatCard icon={<FileText className="h-6 w-6 text-green-600" />} bg="bg-green-100" label="Total Documentos" value={stats.totalDocuments} />
                <StatCard icon={<Users className="h-6 w-6 text-purple-600" />} bg="bg-purple-100" label="Especialidades" value={stats.totalSpecialties} />
              </div>

              <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-4">
                  <div className="mb-4 flex flex-col gap-4 lg:flex-row">
                    <div className="flex-1">
                      <AdvancedSearch onSearch={setSearchFilters} availableTags={tags} />
                    </div>

                    <button
                      onClick={() => setShowAddModal(true)}
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
                    <SelectFilter label="Especialidad" value={filterSpecialty} onChange={setFilterSpecialty}>
                      <option value="all">Todas las especialidades</option>
                      {specialties.map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </SelectFilter>

                    <SelectFilter label="Médico" value={filterDoctor} onChange={setFilterDoctor}>
                      <option value="all">Todos los médicos</option>
                      {doctors.map((doctor) => (
                        <option key={doctor} value={doctor}>
                          {doctor}
                        </option>
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
                    <div className="py-12 text-center">
                      <div className="mb-3 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                      <p className="text-gray-500">Cargando datos...</p>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
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
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <UpcomingControls controls={controls} onControlClick={handleControlClick} />
            </div>
          )}
        </div>

        {selectedAppointment && (
          <LazyOverlay>
            <AppointmentDetail
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              tags={tags}
              onViewFile={(url, name) => setPdfViewer({ url, name })}
            />
          </LazyOverlay>
        )}

        {showAddModal && (
          <LazyOverlay>
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
          </LazyOverlay>
        )}

        {pdfViewer && (
          <LazyOverlay>
            <PDFViewer fileUrl={pdfViewer.url} fileName={pdfViewer.name} onClose={() => setPdfViewer(null)} />
          </LazyOverlay>
        )}

        <MobileBottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AppTab)} />
        <MobileDrawer activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AppTab)} />
        <InstallPrompt />

        {activeTab === 'appointments' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all hover:bg-blue-700 active:scale-95 md:hidden"
            aria-label="Nueva cita"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </>
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
      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 font-medium transition-colors ${
        active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
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

function LazySection({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PanelLoader />}>
      {children}
    </Suspense>
  );
}

function LazyOverlay({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<OverlayLoader />}>
      {children}
    </Suspense>
  );
}

function PanelLoader() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      <p className="text-sm text-gray-500">Cargando modulo...</p>
    </div>
  );
}

function OverlayLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="rounded-lg bg-white px-6 py-5 text-center shadow-xl">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-sm text-gray-500">Abriendo vista...</p>
      </div>
    </div>
  );
}
