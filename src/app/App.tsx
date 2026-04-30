import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { AppTabContent } from './AppTabContent';
import { AppHeader } from './layout/AppHeader';
import { FloatingActionButton } from './layout/FloatingActionButton';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { MobileDrawer } from './layout/MobileDrawer';
import { MobileOptimization } from './layout/MobileOptimization';
import type { AppTab } from './types';
import { useAppointmentFilters } from '../features/appointments/hooks/useAppointmentFilters';
import { useAppointmentsData } from '../features/appointments/hooks/useAppointmentsData';
import { useScheduledAppointmentsData } from '../features/appointments/hooks/useScheduledAppointmentsData';
import { useMedicalProfileData } from '../features/medical-profile/hooks/useMedicalProfileData';
import { ControlAlerts } from '../features/controls/components/ControlAlerts';
import { DeleteAppointmentDialog } from '../features/appointments/components/DeleteAppointmentDialog';
import { InstallPrompt } from '../features/settings/components/InstallPrompt';
import { useMedicationsData } from '../features/medications/hooks/useMedicationsData';
import { useNotificationPreferencesData } from '../features/settings/hooks/useNotificationPreferencesData';
import { useVaccinesData } from '../features/vaccines/hooks/useVaccinesData';
import { useVitalSignsData } from '../features/vital-signs/hooks/useVitalSignsData';
import { importAppData } from '../shared/api/api';
import { checkAndShowReminders } from '../shared/lib/notifications';
import type {
  AppDataBundle,
  Appointment,
  Control,
  Document,
  ScheduledAppointment,
} from '../shared/api/contracts';

const AddAppointmentModal = lazy(async () => {
  const module = await import('../features/appointments/components/AddAppointmentModal');
  return { default: module.AddAppointmentModal };
});

const AppointmentDetail = lazy(async () => {
  const module = await import('../features/appointments/components/AppointmentDetail');
  return { default: module.AppointmentDetail };
});

const PDFViewer = lazy(async () => {
  const module = await import('../features/reports/components/PDFViewer');
  return { default: module.PDFViewer };
});

const ScheduledAppointmentModal = lazy(async () => {
  const module = await import('../features/appointments/components/ScheduledAppointmentModal');
  return { default: module.ScheduledAppointmentModal };
});

export default function App() {
  const {
    appointments,
    controls,
    tags,
    error: appointmentsError,
    isLoading: appointmentsLoading,
    doctors,
    specialties,
    saveAppointment,
    removeAppointment,
    createTag,
    replaceAppointmentsData,
    retryDocumentSummaryForAppointment,
    refreshAppointmentsData,
  } = useAppointmentsData();
  const {
    scheduledAppointments,
    error: scheduledAppointmentsError,
    isLoading: scheduledAppointmentsLoading,
    saveScheduledAppointment,
    removeScheduledAppointment,
    markScheduledAppointmentConverted,
    sendReminderNow,
  } = useScheduledAppointmentsData();
  const {
    medications,
    error: medicationsError,
    isLoading: medicationsLoading,
    addMedication,
    removeMedication,
    toggleMedication,
    replaceMedications,
  } = useMedicationsData();
  const {
    medicalProfile,
    error: medicalProfileError,
    isLoading: medicalProfileLoading,
    updateMedicalProfile,
    replaceMedicalProfile,
  } = useMedicalProfileData();
  const {
    notificationPreferences,
    error: notificationPreferencesError,
    isLoading: notificationPreferencesLoading,
    updateNotificationPreferences,
    replaceNotificationPreferences,
  } = useNotificationPreferencesData();
  const {
    vitalSigns,
    error: vitalSignsError,
    isLoading: vitalSignsLoading,
    addVitalSign,
    removeVitalSign,
    replaceVitalSigns,
  } = useVitalSignsData();
  const {
    vaccines,
    error: vaccinesError,
    isLoading: vaccinesLoading,
    addVaccine,
    removeVaccine,
    replaceVaccines,
  } = useVaccinesData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [showScheduledAppointmentModal, setShowScheduledAppointmentModal] = useState(false);
  const [editingScheduledAppointment, setEditingScheduledAppointment] =
    useState<ScheduledAppointment | null>(null);
  const [scheduledAppointmentToConvert, setScheduledAppointmentToConvert] =
    useState<ScheduledAppointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string } | null>(null);
  const {
    filterSpecialty,
    filterDoctor,
    filterDocType,
    filteredAppointments,
    stats,
    setFilterSpecialty,
    setFilterDoctor,
    setFilterDocType,
    setSearchFilters,
  } = useAppointmentFilters({
    appointments,
    specialties,
  });

  useEffect(() => {
    if (
      !selectedAppointment ||
      !selectedAppointment.documents.some(
        (document) =>
          document.aiSummaryStatus === 'pending' ||
          document.aiSummaryStatus === 'processing'
      )
    ) {
      return;
    }

    const refreshSelectedAppointment = async () => {
      const refreshed = await refreshAppointmentsData();
      if (!refreshed) {
        return;
      }

      const updatedAppointment = refreshed.appointments.find(
        (appointment) => appointment.id === selectedAppointment.id
      );

      setSelectedAppointment(updatedAppointment ?? null);
    };

    void refreshSelectedAppointment();
    const interval = window.setInterval(() => {
      void refreshSelectedAppointment();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [refreshAppointmentsData, selectedAppointment]);

  useEffect(() => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      (appointments.length === 0 && vaccines.length === 0 && controls.length === 0)
    ) {
      return;
    }

    const checkReminders = () => {
      checkAndShowReminders(
        appointments,
        medications,
        vaccines,
        controls,
        notificationPreferences.reminderDays
      );
    };

    checkReminders();

    const interval = window.setInterval(checkReminders, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [appointments, controls, medications, notificationPreferences.reminderDays, vaccines]);

  const handleAddAppointment = async (
    newAppointment: Omit<Appointment, 'id'> & {
      id?: string;
      controls?: Omit<Control, 'specialty' | 'doctor' | 'relatedAppointmentId'>[];
    }
  ) => {
    try {
      const savedAppointment = await saveAppointment(newAppointment);
      if (scheduledAppointmentToConvert) {
        await markScheduledAppointmentConverted(
          scheduledAppointmentToConvert.id,
          savedAppointment.id
        );
        setScheduledAppointmentToConvert(null);
      }
      setShowAddModal(false);
      setEditingAppointment(null);
      setSelectedAppointment(savedAppointment);
      setActiveTab('appointments');
    } catch (error) {
      console.error('Error saving appointment to backend:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAddModal(true);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
  };

  const handleSaveScheduledAppointment = async (
    scheduledAppointment: {
      id?: string;
      scheduledAt: string;
      specialty: string;
      doctor: string;
      location?: string;
      notes?: string;
      expectedDocuments?: Array<{
        id: string;
        type: Document['type'];
        name: string;
        date: string;
      }>;
      status?: ScheduledAppointment['status'];
    }
  ) => {
    await saveScheduledAppointment(scheduledAppointment);
    setShowScheduledAppointmentModal(false);
    setEditingScheduledAppointment(null);
  };

  const handleEditScheduledAppointment = (scheduledAppointment: ScheduledAppointment) => {
    setEditingScheduledAppointment(scheduledAppointment);
    setShowScheduledAppointmentModal(true);
  };

  const handleDeleteScheduledAppointment = async (scheduledAppointment: ScheduledAppointment) => {
    try {
      await removeScheduledAppointment(scheduledAppointment.id);
      setShowScheduledAppointmentModal(false);
      setEditingScheduledAppointment(null);
    } catch (error) {
      console.error('Error deleting scheduled appointment:', error);
    }
  };

  const handleConvertScheduledAppointment = (scheduledAppointment: ScheduledAppointment) => {
    setScheduledAppointmentToConvert(scheduledAppointment);
    setEditingScheduledAppointment(null);
    setShowScheduledAppointmentModal(false);
    setShowAddModal(true);
    setActiveTab('appointments');
  };

  const handleSendScheduledAppointmentReminder = async (
    scheduledAppointment: ScheduledAppointment
  ) => {
    try {
      await sendReminderNow(scheduledAppointment.id);
      window.alert('Recordatorio enviado correctamente.');
    } catch (error) {
      console.error('Error sending scheduled appointment reminder:', error);
      window.alert(
        error instanceof Error
          ? `No pudimos enviar el recordatorio: ${error.message}`
          : 'No pudimos enviar el recordatorio.'
      );
    }
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) {
      return;
    }

    try {
      await removeAppointment(appointmentToDelete.id);
      setSelectedAppointment((current) =>
        current?.id === appointmentToDelete.id ? null : current
      );
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleImportData = async (data: Partial<AppDataBundle>) => {
    const imported = await importAppData(data);
    replaceAppointmentsData({
      appointments: imported.appointments,
      controls: imported.controls,
      tags: imported.tags,
    });
    replaceMedications(imported.medications);
    replaceMedicalProfile(imported.medicalProfile);
    replaceNotificationPreferences(imported.notificationPreferences);
    replaceVitalSigns(imported.vitalSigns);
    replaceVaccines(imported.vaccines);
  };

  const handleControlClick = (control: Control) => {
    const relatedAppointment = appointments.find(
      (appointment) => appointment.id === control.relatedAppointmentId
    );
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

  const exportPayload = useMemo(
    () => ({
      appointments,
      controls,
      medications,
      tags,
      medicalProfile,
      notificationPreferences,
      vitalSigns,
      vaccines,
    }),
    [
      appointments,
      controls,
      medications,
      medicalProfile,
      notificationPreferences,
      tags,
      vaccines,
      vitalSigns,
    ]
  );

  return (
    <>
      <MobileOptimization />

      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-8">
          <AppHeader
            activeTab={activeTab}
            controlsCount={controls.length}
            onTabChange={setActiveTab}
          />

          <ControlAlerts controls={controls} onControlClick={handleControlClick} />

          <AppTabContent
            activeTab={activeTab}
            appointments={appointments}
            appointmentsError={appointmentsError}
            controls={controls}
            controlsError={appointmentsError}
            doctors={doctors}
            exportPayload={exportPayload}
            filteredAppointments={filteredAppointments}
            filterDocType={filterDocType}
            filterDoctor={filterDoctor}
            filterSpecialty={filterSpecialty}
            medicalProfile={medicalProfile}
            appointmentsLoading={appointmentsLoading}
            controlsLoading={appointmentsLoading}
            medicalProfileError={medicalProfileError}
            medications={medications}
            medicationsLoading={medicationsLoading}
            medicationsError={medicationsError}
            notificationPreferences={notificationPreferences}
            notificationPreferencesLoading={notificationPreferencesLoading}
            notificationPreferencesError={notificationPreferencesError}
            scheduledAppointments={scheduledAppointments}
            scheduledAppointmentsError={scheduledAppointmentsError}
            scheduledAppointmentsLoading={scheduledAppointmentsLoading}
            specialties={specialties}
            stats={stats}
            tags={tags}
            vaccines={vaccines}
            vaccinesError={vaccinesError}
            vaccinesLoading={vaccinesLoading}
            vitalSigns={vitalSigns}
            vitalSignsError={vitalSignsError}
            vitalSignsLoading={vitalSignsLoading}
            medicalProfileLoading={medicalProfileLoading}
            onAddAppointment={() => setShowAddModal(true)}
            onAddMedication={addMedication}
            onAddVaccine={addVaccine}
            onAddVitalSign={addVitalSign}
            onAppointmentClick={setSelectedAppointment}
            onControlClick={handleControlClick}
            onDoctorFilterChange={setFilterDoctor}
            onDocumentTypeFilterChange={setFilterDocType}
            onEditAppointment={handleEditAppointment}
            onGlobalSearchResultClick={handleGlobalSearchResultClick}
            onImportData={handleImportData}
            onProfileUpdate={updateMedicalProfile}
            onRemoveMedication={removeMedication}
            onRemoveVaccine={removeVaccine}
            onRemoveVitalSign={removeVitalSign}
            onSearch={setSearchFilters}
            onScheduleAppointment={() => {
              setEditingScheduledAppointment(null);
              setShowScheduledAppointmentModal(true);
            }}
            onScheduledAppointmentClick={handleEditScheduledAppointment}
            onSettingsUpdate={updateNotificationPreferences}
            onSpecialtyFilterChange={setFilterSpecialty}
            onTimelineEventClick={handleTimelineEventClick}
            onToggleMedication={toggleMedication}
          />
        </div>

        {selectedAppointment && (
          <LazyOverlay>
            <AppointmentDetail
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onDelete={handleDeleteAppointment}
              onEdit={handleEditAppointment}
              tags={tags}
              onViewFile={(url, name) => setPdfViewer({ url, name })}
              onRetryDocumentSummary={async (documentId) => {
                const updatedDocument = await retryDocumentSummaryForAppointment(documentId);
                setSelectedAppointment((current) =>
                  current
                    ? {
                        ...current,
                        documents: current.documents.map((document) =>
                          document.id === documentId ? { ...document, ...updatedDocument } : document
                        ),
                      }
                    : current
                );
              }}
            />
          </LazyOverlay>
        )}

        {showAddModal && (
          <LazyOverlay>
            <AddAppointmentModal
              onClose={() => {
                setShowAddModal(false);
                setEditingAppointment(null);
                setScheduledAppointmentToConvert(null);
              }}
              onAdd={handleAddAppointment}
              existingDoctors={doctors}
              existingSpecialties={specialties}
              editingAppointment={editingAppointment || undefined}
              initialDraft={
                scheduledAppointmentToConvert
                  ? {
                      date: scheduledAppointmentToConvert.scheduledAt,
                      specialty: scheduledAppointmentToConvert.specialty,
                      doctor: scheduledAppointmentToConvert.doctor,
                      notes: scheduledAppointmentToConvert.notes,
                      documents: scheduledAppointmentToConvert.expectedDocuments,
                    }
                  : undefined
              }
              existingControls={
                editingAppointment
                  ? controls.filter(
                      (control) => control.relatedAppointmentId === editingAppointment.id
                    )
                  : []
              }
              availableTags={tags}
              onCreateTag={createTag}
            />
          </LazyOverlay>
        )}

        {showScheduledAppointmentModal && (
          <LazyOverlay>
            <ScheduledAppointmentModal
              doctors={doctors}
              open={showScheduledAppointmentModal}
              scheduledAppointment={editingScheduledAppointment || undefined}
              specialties={specialties}
              onClose={() => {
                setShowScheduledAppointmentModal(false);
                setEditingScheduledAppointment(null);
              }}
              onDelete={handleDeleteScheduledAppointment}
              onConvert={handleConvertScheduledAppointment}
              onSendReminder={handleSendScheduledAppointmentReminder}
              onSave={handleSaveScheduledAppointment}
            />
          </LazyOverlay>
        )}

        {pdfViewer && (
          <LazyOverlay>
            <PDFViewer
              fileUrl={pdfViewer.url}
              fileName={pdfViewer.name}
              onClose={() => setPdfViewer(null)}
            />
          </LazyOverlay>
        )}

        <DeleteAppointmentDialog
          appointment={appointmentToDelete}
          open={Boolean(appointmentToDelete)}
          onConfirm={confirmDeleteAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setAppointmentToDelete(null);
            }
          }}
        />

        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        <MobileDrawer activeTab={activeTab} onTabChange={setActiveTab} />
        <InstallPrompt />

        {(activeTab === 'appointments' || activeTab === 'calendar') && (
          <FloatingActionButton
            ariaLabel={activeTab === 'calendar' ? 'Programar cita' : 'Nueva cita'}
            icon={<Plus className="h-6 w-6" />}
            onClick={() => {
              if (activeTab === 'calendar') {
                setEditingScheduledAppointment(null);
                setShowScheduledAppointmentModal(true);
                return;
              }

              setShowAddModal(true);
            }}
          />
        )}
      </div>
    </>
  );
}

function LazyOverlay({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OverlayLoader />}>{children}</Suspense>;
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
