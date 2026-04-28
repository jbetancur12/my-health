import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Mail, MessageSquare, Clock, Check } from 'lucide-react';

export interface NotificationPreferences {
  email: string;
  phone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderDays: number[];
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ preferences, onUpdate }: NotificationSettingsProps) {
  const [email, setEmail] = useState(preferences.email || '');
  const [phone, setPhone] = useState(preferences.phone || '');
  const [emailEnabled, setEmailEnabled] = useState(preferences.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(preferences.smsEnabled);
  const [reminderDays, setReminderDays] = useState<number[]>(preferences.reminderDays);
  const [saved, setSaved] = useState(false);

  const dayOptions = [
    { value: 1, label: '1 día antes' },
    { value: 3, label: '3 días antes' },
    { value: 7, label: '1 semana antes' },
    { value: 14, label: '2 semanas antes' },
    { value: 30, label: '1 mes antes' },
  ];

  const toggleReminderDay = (day: number) => {
    setReminderDays((current) => (
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b)
    ));
  };

  const handleSave = () => {
    onUpdate({ email, phone, emailEnabled, smsEnabled, reminderDays });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración de Notificaciones</h2>
          <p className="text-sm text-gray-600">Configura recordatorios para tus controles médicos</p>
        </div>
      </div>

      <div className="space-y-6">
        <NotificationToggle
          icon={<Mail className="w-5 h-5 text-gray-600" />}
          title="Notificaciones por Email"
          enabled={emailEnabled}
          setEnabled={setEmailEnabled}
          value={email}
          setValue={setEmail}
          type="email"
          placeholder="tu@email.com"
        />

        <NotificationToggle
          icon={<MessageSquare className="w-5 h-5 text-gray-600" />}
          title="Notificaciones por SMS"
          enabled={smsEnabled}
          setEnabled={setSmsEnabled}
          value={phone}
          setValue={setPhone}
          type="tel"
          placeholder="+57 300 123 4567"
        />

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">¿Cuándo recibir recordatorios?</span>
          </div>
          <div className="space-y-2">
            {dayOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={reminderDays.includes(option.value)}
                  onChange={() => toggleReminderDay(option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saved}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-green-600"
        >
          {saved ? <><Check className="w-5 h-5" />Configuración Guardada</> : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}

function NotificationToggle({
  icon,
  title,
  enabled,
  setEnabled,
  value,
  setValue,
  type,
  placeholder,
}: {
  icon: ReactNode;
  title: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  type: string;
  placeholder: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <input
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={!enabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}
