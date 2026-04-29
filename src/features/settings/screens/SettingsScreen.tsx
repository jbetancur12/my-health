import { NotificationSettings } from '../components/NotificationSettings';
import type { NotificationPreferences } from '../../../shared/api/api';

interface SettingsScreenProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void | Promise<unknown>;
}

export function SettingsScreen({ preferences, onUpdate }: SettingsScreenProps) {
  return <NotificationSettings preferences={preferences} onUpdate={onUpdate} />;
}
