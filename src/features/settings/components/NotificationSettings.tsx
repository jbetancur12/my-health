import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Bell, Check, Clock, Mail, MessageCircleMore, MessageSquare } from 'lucide-react';
import { requestNotificationPermission } from '../../../shared/lib/notifications';
import type { NotificationPreferences } from '../../../shared/api/contracts';

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ preferences, onUpdate }: NotificationSettingsProps) {
  const [email, setEmail] = useState(preferences.email || '');
  const [phone, setPhone] = useState(preferences.phone || '');
  const [emailEnabled, setEmailEnabled] = useState(preferences.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(preferences.smsEnabled);
  const [whatsappEnabled, setWhatsappEnabled] = useState(preferences.whatsappEnabled);
  const [whatsappOptIn, setWhatsappOptIn] = useState(preferences.whatsappOptIn);
  const [reminderDays, setReminderDays] = useState<number[]>(preferences.reminderDays);
  const [saved, setSaved] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  async function enableBrowserNotifications() {
    const granted = await requestNotificationPermission();
    setBrowserNotificationsEnabled(granted);

    if (granted) {
      new Notification('Notificaciones activadas', {
        body: 'Recibiras recordatorios de citas y medicamentos mientras la app este abierta.',
        icon: '/icon-192.png',
      });
    }
  }

  const dayOptions = [
    { value: 1, label: '1 dia antes' },
    { value: 3, label: '3 dias antes' },
    { value: 7, label: '1 semana antes' },
    { value: 14, label: '2 semanas antes' },
    { value: 30, label: '1 mes antes' },
  ];

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((item) => item !== day));
      return;
    }

    setReminderDays([...reminderDays, day].sort((a, b) => a - b));
  };

  const handleSave = () => {
    onUpdate({
      email,
      phone,
      emailEnabled,
      smsEnabled,
      whatsappEnabled,
      whatsappOptIn,
      reminderDays,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuracion de Notificaciones</h2>
          <p className="text-sm text-gray-600">
            Configura recordatorios para tus controles medicos
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="mb-3 flex items-start gap-3">
            <Bell className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-gray-900">Notificaciones del Navegador</h3>
              <p className="text-sm text-gray-600">Recibe alertas instantaneas en tu dispositivo</p>
            </div>
          </div>

          {browserNotificationsEnabled ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">Notificaciones activadas</span>
            </div>
          ) : (
            <>
              <button
                onClick={enableBrowserNotifications}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Bell className="h-5 w-5" />
                Activar Notificaciones
              </button>
              <div className="mt-3 flex items-start gap-2 rounded bg-white p-3 text-sm text-gray-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <p>
                  Solo funciona si mantienes la app abierta en el navegador o instalada como PWA.
                </p>
              </div>
            </>
          )}
        </div>

        <NotificationToggle
          icon={<Mail className="h-5 w-5 text-gray-600" />}
          title="Notificaciones por Email"
          enabled={emailEnabled}
          setEnabled={setEmailEnabled}
          value={email}
          setValue={setEmail}
          type="email"
          placeholder="tu@email.com"
          helperText="Recibiras recordatorios por email cuando conectemos un servicio externo."
        />

        <NotificationToggle
          icon={<MessageSquare className="h-5 w-5 text-gray-600" />}
          title="Notificaciones por SMS"
          enabled={smsEnabled}
          setEnabled={setSmsEnabled}
          value={phone}
          setValue={setPhone}
          type="tel"
          placeholder="+57 300 123 4567"
          helperText="Recibiras SMS cuando conectemos un servicio externo."
        />

        <div className="rounded-lg bg-gray-50 p-4">
          <NotificationToggle
            icon={<MessageCircleMore className="h-5 w-5 text-green-600" />}
            title="Recordatorios por WhatsApp"
            enabled={whatsappEnabled}
            setEnabled={setWhatsappEnabled}
            value={phone}
            setValue={setPhone}
            type="tel"
            placeholder="573001234567"
            helperText="Usaremos Meta WhatsApp Cloud API y un template aprobado para mandarte recordatorios."
          />

          {whatsappEnabled && (
            <label className="mt-3 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(event) => setWhatsappOptIn(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
              />
              <span>
                Confirmo que quiero recibir recordatorios por WhatsApp en este número.
              </span>
            </label>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Cuando recibir recordatorios</span>
          </div>

          <div className="space-y-2">
            {dayOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 transition-colors hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={reminderDays.includes(option.value)}
                  onChange={() => toggleReminderDay(option.value)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>

          {reminderDays.length === 0 && (
            <p className="mt-2 text-xs text-orange-600">
              Selecciona al menos un intervalo para ver recordatorios.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> La app hoy envia recordatorios del navegador y ya puede usar
            WhatsApp si configuras Meta Cloud API y un template aprobado. Email y SMS siguen como
            preparacion de interfaz.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saved}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-green-600"
        >
          {saved ? (
            <>
              <Check className="h-5 w-5" />
              Configuracion Guardada
            </>
          ) : (
            'Guardar Configuracion'
          )}
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
  helperText,
}: {
  icon: ReactNode;
  title: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  type: string;
  placeholder: string;
  helperText: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:border-white"></div>
        </label>
      </div>
      <input
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={!enabled}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      {enabled && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
