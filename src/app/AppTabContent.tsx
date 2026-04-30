import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import type { AppTab } from './types';
import { AppointmentsScreen } from '../features/appointments/screens/AppointmentsScreen';
import { ControlsScreen } from '../features/controls/screens/ControlsScreen';
import { ExportData } from '../features/export/components/ExportData';
import { MedicalProfileScreen } from '../features/medical-profile/screens/MedicalProfileScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { FeatureStatePanel } from '../shared/components/FeatureStatePanel';
import type { AppointmentStats } from '../features/appointments/hooks/useAppointmentFilters';
import type {
  Appointment,
  AppDataBundle,
  ClinicalMemory,
  ClinicalSuggestion,
  ClinicalSuggestionStatus,
  Control,
  MedicalProfile,
  Medication,
  NotificationPreferences,
  ScheduledAppointment,
  Vaccine,
  VitalSignReading,
} from '../shared/api/contracts';
import type { SearchFilters } from '../features/appointments/components/AdvancedSearch';
import type { AppointmentTag as UiAppointmentTag } from '../shared/api/contracts';

const Dashboard = lazy(async () => {
  const module = await import('../features/dashboard/components/Dashboard');
  return { default: module.Dashboard };
});

const MedicationManager = lazy(async () => {
  const module = await import('../features/medications/components/MedicationManager');
  return { default: module.MedicationManager };
});

const CalendarView = lazy(async () => {
  const module = await import('../features/controls/components/CalendarView');
  return { default: module.CalendarView };
});

const ImportData = lazy(async () => {
  const module = await import('../features/import/components/ImportData');
  return { default: module.ImportData };
});

const VitalSigns = lazy(async () => {
  const module = await import('../features/vital-signs/components/VitalSigns');
  return { default: module.VitalSigns };
});

const VaccineHistory = lazy(async () => {
  const module = await import('../features/vaccines/components/VaccineHistory');
  return { default: module.VaccineHistory };
});

const Timeline = lazy(async () => {
  const module = await import('../features/timeline/components/Timeline');
  return { default: module.Timeline };
});

const GlobalSearch = lazy(async () => {
  const module = await import('../features/search/components/GlobalSearch');
  return { default: module.GlobalSearch };
});

const MedicalCalculators = lazy(async () => {
  const module = await import('../features/calculators/components/MedicalCalculators');
  return { default: module.MedicalCalculators };
});

const PDFReport = lazy(async () => {
  const module = await import('../features/reports/components/PDFReport');
  return { default: module.PDFReport };
});

interface AppTabContentProps {
  activeTab: AppTab;
  appointments: Appointment[];
  appointmentsError: string | null;
  appointmentsLoading: boolean;
  controls: Control[];
  controlsError: string | null;
  controlsLoading: boolean;
  doctors: string[];
  exportPayload: AppDataBundle;
  filteredAppointments: Appointment[];
  filterDocType: string;
  filterDoctor: string;
  filterSpecialty: string;
  medicalProfile: MedicalProfile;
  clinicalMemory: ClinicalMemory;
  clinicalSuggestions: ClinicalSuggestion[];
  medicalProfileError: string | null;
  medicalProfileLoading: boolean;
  clinicalMemoryError: string | null;
  clinicalMemoryLoading: boolean;
  clinicalSuggestionsError: string | null;
  clinicalSuggestionsLoading: boolean;
  medications: Medication[];
  medicationsError: string | null;
  medicationsLoading: boolean;
  notificationPreferences: NotificationPreferences;
  notificationPreferencesError: string | null;
  notificationPreferencesLoading: boolean;
  specialties: string[];
  stats: AppointmentStats;
  scheduledAppointments: ScheduledAppointment[];
  scheduledAppointmentsError: string | null;
  scheduledAppointmentsLoading: boolean;
  tags: UiAppointmentTag[];
  vaccines: Vaccine[];
  vaccinesError: string | null;
  vaccinesLoading: boolean;
  vitalSigns: VitalSignReading[];
  vitalSignsError: string | null;
  vitalSignsLoading: boolean;
  onAddAppointment: () => void;
  onAddMedication: (medication: Omit<Medication, 'id'>) => void | Promise<unknown>;
  onAddVaccine: (vaccine: Omit<Vaccine, 'id'>) => void | Promise<unknown>;
  onAddVitalSign: (reading: Omit<VitalSignReading, 'id'>) => void | Promise<unknown>;
  onAppointmentClick: (appointment: Appointment) => void;
  onControlClick: (control: Control) => void;
  onDoctorFilterChange: (value: string) => void;
  onDocumentTypeFilterChange: (value: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onGlobalSearchResultClick: (result: { type: string; data: unknown }) => void;
  onImportData: (data: Partial<AppDataBundle>) => void | Promise<void>;
  onProfileUpdate: (profile: MedicalProfile) => void | Promise<unknown>;
  onScheduleClinicalSuggestion: (suggestion: ClinicalSuggestion) => void | Promise<unknown>;
  onClinicalSuggestionStatusChange: (
    id: string,
    status: ClinicalSuggestionStatus
  ) => void | Promise<unknown>;
  onRemoveMedication: (id: string) => void | Promise<unknown>;
  onRemoveVaccine: (id: string) => void | Promise<unknown>;
  onRemoveVitalSign: (id: string) => void | Promise<unknown>;
  onSearch: (filters: SearchFilters) => void;
  onScheduleAppointment: () => void;
  onScheduledAppointmentClick: (scheduledAppointment: ScheduledAppointment) => void;
  onSettingsUpdate: (preferences: NotificationPreferences) => void | Promise<unknown>;
  onSpecialtyFilterChange: (value: string) => void;
  onTimelineEventClick: (event: { type: string; data: unknown }) => void;
  onToggleMedication: (id: string) => void | Promise<unknown>;
}

export function AppTabContent({
  activeTab,
  appointments,
  appointmentsError,
  appointmentsLoading,
  controls,
  controlsError,
  controlsLoading,
  doctors,
  exportPayload,
  filteredAppointments,
  filterDocType,
  filterDoctor,
  filterSpecialty,
  medicalProfile,
  clinicalMemory,
  clinicalSuggestions,
  medicalProfileError,
  medicalProfileLoading,
  clinicalMemoryError,
  clinicalMemoryLoading,
  clinicalSuggestionsError,
  clinicalSuggestionsLoading,
  medications,
  medicationsError,
  medicationsLoading,
  notificationPreferences,
  notificationPreferencesError,
  notificationPreferencesLoading,
  specialties,
  stats,
  scheduledAppointments,
  scheduledAppointmentsError,
  scheduledAppointmentsLoading,
  tags,
  vaccines,
  vaccinesError,
  vaccinesLoading,
  vitalSigns,
  vitalSignsError,
  vitalSignsLoading,
  onAddAppointment,
  onAddMedication,
  onAddVaccine,
  onAddVitalSign,
  onAppointmentClick,
  onControlClick,
  onDoctorFilterChange,
  onDocumentTypeFilterChange,
  onEditAppointment,
  onGlobalSearchResultClick,
  onImportData,
  onProfileUpdate,
  onScheduleClinicalSuggestion,
  onClinicalSuggestionStatusChange,
  onRemoveMedication,
  onRemoveVaccine,
  onRemoveVitalSign,
  onSearch,
  onScheduleAppointment,
  onScheduledAppointmentClick,
  onSettingsUpdate,
  onSpecialtyFilterChange,
  onTimelineEventClick,
  onToggleMedication,
}: AppTabContentProps) {
  if (activeTab === 'dashboard') {
    if (appointmentsLoading || medicationsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando dashboard"
          message="Estamos preparando el resumen de tu información médica."
        />
      );
    }

    if (appointmentsError || medicationsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar el dashboard"
          message={appointmentsError ?? medicationsError ?? 'Intenta nuevamente en unos segundos.'}
        />
      );
    }

    if (appointments.length === 0 && medications.length === 0) {
      return (
        <FeatureStatePanel
          variant="empty"
          title="Todavía no hay actividad"
          message="Cuando registres citas o medicamentos, aquí verás un resumen útil."
        />
      );
    }

    return (
      <LazySection>
        <Dashboard appointments={appointments} medications={medications} />
      </LazySection>
    );
  }

  if (activeTab === 'medications') {
    if (medicationsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando medicamentos"
          message="Estamos trayendo tu tratamiento actual."
        />
      );
    }

    if (medicationsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar los medicamentos"
          message={medicationsError}
        />
      );
    }

    return (
      <LazySection>
        <MedicationManager
          medications={medications}
          onAdd={onAddMedication}
          onRemove={onRemoveMedication}
          onToggle={onToggleMedication}
        />
      </LazySection>
    );
  }

  if (activeTab === 'calendar') {
    if (appointmentsLoading || controlsLoading || scheduledAppointmentsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando calendario"
          message="Estamos organizando tus citas y controles."
        />
      );
    }

    if (appointmentsError || controlsError || scheduledAppointmentsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar el calendario"
          message={
            appointmentsError ??
            controlsError ??
            scheduledAppointmentsError ??
            'Intenta nuevamente en unos segundos.'
          }
        />
      );
    }

    return (
      <LazySection>
        <CalendarView
          appointments={appointments}
          controls={controls}
          scheduledAppointments={scheduledAppointments}
          onAppointmentClick={onAppointmentClick}
          onControlClick={onControlClick}
          onScheduledAppointmentClick={onScheduledAppointmentClick}
          onScheduleAppointment={onScheduleAppointment}
        />
      </LazySection>
    );
  }

  if (activeTab === 'settings') {
    if (notificationPreferencesLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando configuración"
          message="Estamos trayendo tus preferencias de notificación."
        />
      );
    }

    if (notificationPreferencesError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar la configuración"
          message={notificationPreferencesError}
        />
      );
    }

    return (
      <LazySection>
        <SettingsScreen preferences={notificationPreferences} onUpdate={onSettingsUpdate} />
      </LazySection>
    );
  }

  if (activeTab === 'export') {
    return (
      <ExportData
        data={exportPayload}
        filename={`archivo-medico-${new Date().toISOString().split('T')[0]}`}
      />
    );
  }

  if (activeTab === 'import') {
    return (
      <LazySection>
        <ImportData onImport={onImportData} />
      </LazySection>
    );
  }

  if (activeTab === 'profile') {
    if (medicalProfileLoading || clinicalMemoryLoading || clinicalSuggestionsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando perfil médico ampliado"
          message="Estamos preparando tu información personal, la memoria clínica consolidada y las sugerencias revisables."
        />
      );
    }

    if (medicalProfileError || clinicalMemoryError || clinicalSuggestionsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar el perfil médico"
          message={
            medicalProfileError ??
            clinicalMemoryError ??
            clinicalSuggestionsError ??
            'Intenta nuevamente en unos segundos.'
          }
        />
      );
    }

    return (
      <MedicalProfileScreen
        profile={medicalProfile}
        clinicalMemory={clinicalMemory}
        clinicalSuggestions={clinicalSuggestions}
        onUpdate={onProfileUpdate}
        onScheduleSuggestion={onScheduleClinicalSuggestion}
        onSuggestionStatusChange={onClinicalSuggestionStatusChange}
      />
    );
  }

  if (activeTab === 'vitals') {
    if (vitalSignsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando signos vitales"
          message="Estamos preparando tu historial de mediciones."
        />
      );
    }

    if (vitalSignsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar los signos vitales"
          message={vitalSignsError}
        />
      );
    }

    return (
      <LazySection>
        <VitalSigns readings={vitalSigns} onAdd={onAddVitalSign} onRemove={onRemoveVitalSign} />
      </LazySection>
    );
  }

  if (activeTab === 'vaccines') {
    if (vaccinesLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando vacunas"
          message="Estamos preparando tu historial de inmunización."
        />
      );
    }

    if (vaccinesError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar las vacunas"
          message={vaccinesError}
        />
      );
    }

    return (
      <LazySection>
        <VaccineHistory vaccines={vaccines} onAdd={onAddVaccine} onRemove={onRemoveVaccine} />
      </LazySection>
    );
  }

  if (activeTab === 'timeline') {
    if (appointmentsLoading || medicationsLoading || vaccinesLoading || vitalSignsLoading) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando timeline"
          message="Estamos construyendo tu línea de tiempo médica."
        />
      );
    }

    if (appointmentsError || medicationsError || vaccinesError || vitalSignsError) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos cargar el timeline"
          message={
            appointmentsError ??
            medicationsError ??
            vaccinesError ??
            vitalSignsError ??
            'Intenta nuevamente en unos segundos.'
          }
        />
      );
    }

    if (
      appointments.length === 0 &&
      medications.length === 0 &&
      vaccines.length === 0 &&
      vitalSigns.length === 0
    ) {
      return (
        <FeatureStatePanel
          variant="empty"
          title="Todavía no hay eventos en el timeline"
          message="Agrega citas, medicamentos, vacunas o signos vitales para ver tu historial consolidado."
        />
      );
    }

    return (
      <LazySection>
        <Timeline
          appointments={appointments}
          medications={medications}
          vaccines={vaccines}
          vitalSigns={vitalSigns}
          onEventClick={onTimelineEventClick}
        />
      </LazySection>
    );
  }

  if (activeTab === 'search') {
    if (
      appointmentsLoading ||
      medicationsLoading ||
      vaccinesLoading ||
      vitalSignsLoading ||
      medicalProfileLoading
    ) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Cargando búsqueda global"
          message="Estamos indexando tu información para buscar mejor."
        />
      );
    }

    if (
      appointmentsError ||
      medicationsError ||
      vaccinesError ||
      vitalSignsError ||
      medicalProfileError
    ) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos preparar la búsqueda"
          message={
            appointmentsError ??
            medicationsError ??
            vaccinesError ??
            vitalSignsError ??
            medicalProfileError ??
            'Intenta nuevamente en unos segundos.'
          }
        />
      );
    }

    if (
      appointments.length === 0 &&
      medications.length === 0 &&
      vaccines.length === 0 &&
      vitalSigns.length === 0
    ) {
      return (
        <FeatureStatePanel
          variant="empty"
          title="Todavía no hay datos para buscar"
          message="Cuando empieces a registrar información médica, aquí podrás encontrarla rápido."
        />
      );
    }

    return (
      <LazySection>
        <GlobalSearch
          appointments={appointments}
          medications={medications}
          vaccines={vaccines}
          vitalSigns={vitalSigns}
          medicalProfile={medicalProfile}
          onResultClick={onGlobalSearchResultClick}
        />
      </LazySection>
    );
  }

  if (activeTab === 'calculators') {
    return (
      <LazySection>
        <MedicalCalculators />
      </LazySection>
    );
  }

  if (activeTab === 'pdf') {
    if (
      appointmentsLoading ||
      controlsLoading ||
      medicationsLoading ||
      vaccinesLoading ||
      vitalSignsLoading ||
      medicalProfileLoading
    ) {
      return (
        <FeatureStatePanel
          variant="loading"
          title="Preparando PDF"
          message="Estamos reuniendo toda tu información para el reporte."
        />
      );
    }

    if (
      appointmentsError ||
      controlsError ||
      medicationsError ||
      vaccinesError ||
      vitalSignsError ||
      medicalProfileError
    ) {
      return (
        <FeatureStatePanel
          variant="error"
          title="No pudimos preparar el reporte"
          message={
            appointmentsError ??
            controlsError ??
            medicationsError ??
            vaccinesError ??
            vitalSignsError ??
            medicalProfileError ??
            'Intenta nuevamente en unos segundos.'
          }
        />
      );
    }

    return (
        <LazySection>
          <PDFReport
            appointments={appointments}
            clinicalMemory={clinicalMemory}
            medications={medications}
            vaccines={vaccines}
            vitalSigns={vitalSigns}
            medicalProfile={medicalProfile}
          />
      </LazySection>
    );
  }

  if (activeTab === 'appointments') {
    return (
      <AppointmentsScreen
        appointments={appointments}
        availableTags={tags}
        doctors={doctors}
        specialties={specialties}
        filteredAppointments={filteredAppointments}
        filterDocType={filterDocType}
        filterDoctor={filterDoctor}
        filterSpecialty={filterSpecialty}
        stats={stats}
        onAddAppointment={onAddAppointment}
        onDoctorFilterChange={onDoctorFilterChange}
        onDocumentTypeFilterChange={onDocumentTypeFilterChange}
        onEditAppointment={onEditAppointment}
        onSearch={onSearch}
        onSelectAppointment={onAppointmentClick}
        onSpecialtyFilterChange={onSpecialtyFilterChange}
      />
    );
  }

  if (controlsLoading) {
    return (
      <FeatureStatePanel
        variant="loading"
        title="Cargando controles"
        message="Estamos preparando tus próximos controles médicos."
      />
    );
  }

  if (controlsError) {
    return (
      <FeatureStatePanel
        variant="error"
        title="No pudimos cargar los controles"
        message={controlsError}
      />
    );
  }

  return <ControlsScreen controls={controls} onControlClick={onControlClick} />;
}

function LazySection({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <FeatureStatePanel
          variant="loading"
          title="Cargando módulo"
          message="Estamos preparando esta sección."
        />
      }
    >
      {children}
    </Suspense>
  );
}
