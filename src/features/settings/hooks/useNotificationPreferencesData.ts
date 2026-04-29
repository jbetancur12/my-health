import { useEffect, useState } from 'react';
import * as api from '../../../shared/api/api';
import type { NotificationPreferences } from '../../../shared/api/contracts';

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: '',
  phone: '',
  emailEnabled: false,
  smsEnabled: false,
  reminderDays: [7, 3, 1],
};

export function useNotificationPreferencesData() {
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const preferences = await api.getNotificationPreferences();
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setError('No pudimos cargar la configuración de notificaciones.');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateNotificationPreferences(preferences: NotificationPreferences) {
    const savedPreferences = await api.saveNotificationPreferences(preferences);
    setNotificationPreferences(savedPreferences);
    return savedPreferences;
  }

  function replaceNotificationPreferences(preferences: NotificationPreferences) {
    setNotificationPreferences(preferences);
  }

  return {
    notificationPreferences,
    error,
    isLoading,
    updateNotificationPreferences,
    replaceNotificationPreferences,
  };
}
