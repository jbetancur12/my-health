import { useEffect, useMemo, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { Appointment, AppointmentTag, Control } from '../../../shared/api/contracts';

export function useAppointmentsData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [tags, setTags] = useState<AppointmentTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const [appointmentsData, controlsData, tagsData] = await Promise.all([
        api.getAppointments(),
        api.getControls(),
        api.getTags(),
      ]);

      setAppointments(appointmentsData);
      setControls(controlsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading appointments data:', error);
      setError('No pudimos cargar citas, controles y etiquetas en este momento.');
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

  async function saveAppointment(
    appointment: Omit<Appointment, 'id'> & {
      id?: string;
      controls?: Omit<Control, 'id' | 'specialty' | 'doctor' | 'relatedAppointmentId'>[];
    },
  ) {
    const documentsWithoutFiles = appointment.documents.map((document) => ({
      id: document.id,
      type: document.type,
      name: document.name,
      date: document.date,
    }));

    let savedAppointment: Appointment;

    if (appointment.id) {
      savedAppointment = await api.updateAppointment(appointment.id, {
        date: appointment.date,
        specialty: appointment.specialty,
        doctor: appointment.doctor,
        documents: documentsWithoutFiles,
        notes: appointment.notes,
        tags: appointment.tags,
      });

      for (const document of appointment.documents) {
        if (document.file) {
          const fileUrl = await api.uploadFile(document.file, savedAppointment.id, document.id);
          const docIndex = savedAppointment.documents.findIndex((item) => item.id === document.id);
          if (docIndex !== -1) {
            savedAppointment.documents[docIndex].fileUrl = fileUrl;
          }
        }
      }

      setAppointments((current) =>
        current.map((currentAppointment) =>
          currentAppointment.id === savedAppointment.id ? savedAppointment : currentAppointment,
        ),
      );
    } else {
      savedAppointment = await api.saveAppointment({
        date: appointment.date,
        specialty: appointment.specialty,
        doctor: appointment.doctor,
        documents: documentsWithoutFiles,
        notes: appointment.notes,
        tags: appointment.tags,
      });

      for (const document of appointment.documents) {
        if (document.file) {
          const fileUrl = await api.uploadFile(document.file, savedAppointment.id, document.id);
          const docIndex = savedAppointment.documents.findIndex((item) => item.id === document.id);
          if (docIndex !== -1) {
            savedAppointment.documents[docIndex].fileUrl = fileUrl;
          }
        }
      }

      setAppointments((current) => [savedAppointment, ...current]);

      if (appointment.controls && appointment.controls.length > 0) {
        const savedControls: Control[] = [];
        for (const control of appointment.controls) {
          const savedControl = await api.saveControl({
            date: control.date,
            type: control.type,
            specialty: appointment.specialty,
            doctor: appointment.doctor,
            relatedAppointmentId: savedAppointment.id,
          });
          savedControls.push(savedControl);
        }

        setControls((current) => [...current, ...savedControls]);
      }
    }

    return savedAppointment;
  }

  async function createTag(tag: Omit<AppointmentTag, 'id'>) {
    const savedTag = await api.saveTag(tag);
    setTags((current) => [...current, savedTag]);
    return savedTag;
  }

  function replaceAppointmentsData(data: {
    appointments: Appointment[];
    controls: Control[];
    tags: AppointmentTag[];
  }) {
    setAppointments(data.appointments);
    setControls(data.controls);
    setTags(data.tags);
  }

  return {
    appointments,
    controls,
    tags,
    error,
    isLoading,
    doctors,
    specialties,
    saveAppointment,
    createTag,
    replaceAppointmentsData,
  };
}
