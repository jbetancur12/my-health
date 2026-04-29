// Web Notifications API helper
import type { Appointment, Control, Medication, Vaccine } from '../api/contracts';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      icon: '/icon-192.png',
      vibrate: [200, 100, 200],
      ...options,
    };

    new Notification(title, notificationOptions);
  }
}

export function scheduleNotification(title: string, body: string, date: Date) {
  const now = new Date();
  const delay = date.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      showNotification(title, { body });
    }, delay);
  }
}

export interface NotificationReminder {
  id: string;
  title: string;
  body: string;
  date: Date;
  type: 'appointment' | 'medication' | 'vaccine' | 'control';
}

export function checkAndShowReminders(
  appointments: Appointment[],
  medications: Medication[],
  vaccines: Vaccine[],
  controls: Control[],
  reminderDays: number[]
) {
  const now = new Date();
  const reminders: NotificationReminder[] = [];

  // Check appointments
  appointments.forEach((apt) => {
    const aptDate = new Date(apt.date);
    const daysUntil = Math.ceil((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && reminderDays.includes(daysUntil)) {
      reminders.push({
        id: `apt-${apt.id}`,
        title: `Cita Médica: ${apt.specialty}`,
        body: `Tienes una cita con ${apt.doctor} en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
        date: aptDate,
        type: 'appointment',
      });
    }
  });

  // Check vaccines next doses
  vaccines.forEach((vac) => {
    if (vac.nextDose) {
      const doseDate = new Date(vac.nextDose);
      const daysUntil = Math.ceil((doseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && reminderDays.includes(daysUntil)) {
        reminders.push({
          id: `vac-${vac.id}`,
          title: `Próxima Dosis: ${vac.name}`,
          body: `Tienes una dosis programada en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
          date: doseDate,
          type: 'vaccine',
        });
      }
    }
  });

  // Check controls
  controls.forEach((ctrl) => {
    const ctrlDate = new Date(ctrl.date);
    const daysUntil = Math.ceil((ctrlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && reminderDays.includes(daysUntil)) {
      reminders.push({
        id: `ctrl-${ctrl.id}`,
        title: `Control Médico: ${ctrl.specialty}`,
        body: `${ctrl.type} con ${ctrl.doctor} en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
        date: ctrlDate,
        type: 'control',
      });
    }
  });

  // Show notifications
  reminders.forEach((reminder) => {
    showNotification(reminder.title, {
      body: reminder.body,
      tag: reminder.id, // Prevents duplicate notifications
    });
  });

  return reminders;
}

// Check for active medications that need reminders
export function checkMedicationReminders(medications: Medication[]) {
  const activeMeds = medications.filter((m) => m.active);

  if (activeMeds.length > 0) {
    showNotification('Recordatorio de Medicamentos', {
      body: `Tienes ${activeMeds.length} medicamento${activeMeds.length !== 1 ? 's' : ''} activo${activeMeds.length !== 1 ? 's' : ''}. No olvides tomarlos según lo prescrito.`,
      tag: 'medication-reminder',
    });
  }
}
