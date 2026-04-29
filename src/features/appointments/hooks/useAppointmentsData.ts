import { useEffect, useMemo, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { Appointment, AppointmentTag, Control } from '../../../shared/api/contracts';
import { buildAutocompleteOptions } from '../lib/autocomplete';

type PendingAppointmentControl = Omit<Control, 'specialty' | 'doctor' | 'relatedAppointmentId'>;

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
    return buildAutocompleteOptions(
      appointments.map((appointment) => appointment.specialty)
    );
  }, [appointments]);

  const doctors = useMemo(() => {
    return buildAutocompleteOptions(
      appointments.map((appointment) => appointment.doctor)
    );
  }, [appointments]);

  async function saveAppointment(
    appointment: Omit<Appointment, 'id'> & {
      id?: string;
      controls?: PendingAppointmentControl[];
    }
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
    } else {
      savedAppointment = await api.saveAppointment({
        date: appointment.date,
        specialty: appointment.specialty,
        doctor: appointment.doctor,
        documents: documentsWithoutFiles,
        notes: appointment.notes,
        tags: appointment.tags,
      });
    }

    for (const document of appointment.documents) {
      if (document.file) {
        const fileUrl = await api.uploadFile(document.file, savedAppointment.id, document.id);
        const docIndex = savedAppointment.documents.findIndex((item) => item.id === document.id);
        if (docIndex !== -1) {
          savedAppointment.documents[docIndex].fileUrl = fileUrl;
        }
      }
    }

    const syncedControls = await syncAppointmentControls({
      appointmentId: savedAppointment.id,
      specialty: appointment.specialty,
      doctor: appointment.doctor,
      controls: appointment.controls ?? [],
      existingControls: controls.filter((control) => control.relatedAppointmentId === savedAppointment.id),
    });

    setAppointments((current) => {
      if (appointment.id) {
        return current.map((currentAppointment) =>
          currentAppointment.id === savedAppointment.id ? savedAppointment : currentAppointment
        );
      }

      return [savedAppointment, ...current];
    });

    setControls((current) => {
      const unrelatedControls = current.filter(
        (control) => control.relatedAppointmentId !== savedAppointment.id
      );
      return [...unrelatedControls, ...syncedControls].sort(
        (left, right) => left.date.getTime() - right.date.getTime()
      );
    });

    return savedAppointment;
  }

  async function syncAppointmentControls(input: {
    appointmentId: string;
    specialty: string;
    doctor: string;
    controls: PendingAppointmentControl[];
    existingControls: Control[];
  }) {
    const { appointmentId, specialty, doctor, controls: incomingControls, existingControls } = input;
    const existingById = new Map(existingControls.map((control) => [control.id, control]));
    const incomingIds = new Set(incomingControls.map((control) => control.id));

    for (const existingControl of existingControls) {
      if (!incomingIds.has(existingControl.id)) {
        await api.deleteControl(existingControl.id);
      }
    }

    const savedControls: Control[] = [];
    for (const control of incomingControls) {
      const payload = {
        date: control.date,
        type: control.type,
        specialty,
        doctor,
        relatedAppointmentId: appointmentId,
      };

      if (existingById.has(control.id)) {
        savedControls.push(await api.updateControl(control.id, payload));
      } else {
        savedControls.push(await api.saveControl(payload));
      }
    }

    return savedControls;
  }

  async function createTag(tag: Omit<AppointmentTag, 'id'>) {
    const savedTag = await api.saveTag(tag);
    setTags((current) => [...current, savedTag]);
    return savedTag;
  }

  async function removeAppointment(appointmentId: string) {
    await api.deleteAppointment(appointmentId);

    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== appointmentId)
    );
    setControls((current) =>
      current.filter((control) => control.relatedAppointmentId !== appointmentId)
    );
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
    removeAppointment,
    createTag,
    replaceAppointmentsData,
  };
}
