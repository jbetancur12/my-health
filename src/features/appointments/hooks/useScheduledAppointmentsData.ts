import { useCallback, useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { ScheduledAppointment, ScheduledAppointmentApiPayload } from '../../../shared/api/contracts';

export function useScheduledAppointmentsData() {
  const [scheduledAppointments, setScheduledAppointments] = useState<ScheduledAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getScheduledAppointments();
      setScheduledAppointments(data);
      return data;
    } catch (loadError) {
      console.error('Error loading scheduled appointments:', loadError);
      setError('No pudimos cargar las citas programadas.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function saveScheduledAppointment(
    input: ScheduledAppointmentApiPayload & { id?: string }
  ) {
    const saved = input.id
      ? await api.updateScheduledAppointment(input.id, input)
      : await api.saveScheduledAppointment(input);

    setScheduledAppointments((current) => {
      const withoutCurrent = current.filter((item) => item.id !== saved.id);
      return [...withoutCurrent, saved].sort(
        (left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime()
      );
    });

    return saved;
  }

  async function removeScheduledAppointment(id: string) {
    await api.deleteScheduledAppointment(id);
    setScheduledAppointments((current) => current.filter((item) => item.id !== id));
  }

  async function markScheduledAppointmentConverted(id: string, appointmentId: string) {
    const saved = await api.convertScheduledAppointment(id, appointmentId);
    setScheduledAppointments((current) =>
      current.map((item) => (item.id === saved.id ? saved : item))
    );
    return saved;
  }

  async function sendReminderNow(id: string) {
    const saved = await api.sendScheduledAppointmentReminder(id);
    setScheduledAppointments((current) =>
      current.map((item) => (item.id === saved.id ? saved : item))
    );
    return saved;
  }

  return {
    scheduledAppointments,
    error,
    isLoading,
    saveScheduledAppointment,
    removeScheduledAppointment,
    markScheduledAppointmentConverted,
    sendReminderNow,
    refreshScheduledAppointments: loadData,
  };
}
