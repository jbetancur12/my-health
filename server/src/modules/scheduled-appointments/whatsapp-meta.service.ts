import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NotificationPreference } from '../../entities/NotificationPreference.js';
import { ScheduledAppointment } from '../../entities/ScheduledAppointment.js';
import { getOrm } from '../../orm.js';
import { findFirst } from '../shared/find-first.js';
import { ValidationError } from '../shared/validation.js';

const DEFAULT_META_GRAPH_API_VERSION = 'v23.0';
const DEFAULT_REMINDER_INTERVAL_MS = 15 * 60 * 1000;

interface MetaWhatsappConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  templateName: string;
  languageCode: string;
  graphApiVersion: string;
}

function getMetaWhatsappConfig(): MetaWhatsappConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_APPOINTMENT_REMINDER?.trim();

  if (!accessToken || !phoneNumberId || !templateName) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || undefined,
    templateName,
    languageCode: process.env.WHATSAPP_LANGUAGE_CODE?.trim() || 'es_CO',
    graphApiVersion:
      process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_META_GRAPH_API_VERSION,
  };
}

function normalizeWhatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function buildReminderParameters(scheduledAppointment: ScheduledAppointment) {
  return [
    scheduledAppointment.specialty,
    scheduledAppointment.doctor,
    format(scheduledAppointment.scheduledAt, "d 'de' MMMM 'de' yyyy 'a las' h:mm a", {
      locale: es,
    }),
    scheduledAppointment.location?.trim() || 'Ubicación por confirmar',
  ];
}

async function sendMetaTemplateReminder(
  to: string,
  scheduledAppointment: ScheduledAppointment,
  config: MetaWhatsappConfig
) {
  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: config.templateName,
          language: {
            code: config.languageCode,
          },
          components: [
            {
              type: 'body',
              parameters: buildReminderParameters(scheduledAppointment).map((text) => ({
                type: 'text',
                text,
              })),
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ValidationError(
      `Meta WhatsApp respondió ${response.status}: ${errorText}`,
      response.status >= 500 ? 502 : 400
    );
  }
}

async function getReminderContext() {
  const config = getMetaWhatsappConfig();
  if (!config) {
    throw new ValidationError('WhatsApp no está configurado en este entorno.');
  }

  const orm = await getOrm();
  const em = orm.em.fork();
  const preferences = await findFirst(em, NotificationPreference, { createdAt: 'asc' });

  if (!preferences?.whatsappEnabled) {
    throw new ValidationError('Activa WhatsApp en configuración antes de enviar recordatorios.');
  }

  if (!preferences.whatsappOptIn) {
    throw new ValidationError(
      'Debes marcar el consentimiento de WhatsApp antes de enviar recordatorios.'
    );
  }

  if (!preferences.phone) {
    throw new ValidationError('Configura un número de WhatsApp antes de enviar recordatorios.');
  }

  const to = normalizeWhatsappPhone(preferences.phone);
  if (!to) {
    throw new ValidationError('El número de WhatsApp no tiene un formato válido.');
  }

  return { config, em, preferences, to };
}

function pickDueReminderOffsets(
  reminderDays: number[],
  reminderSentOffsets: number[],
  scheduledAt: Date,
  now: Date
) {
  const hoursUntilAppointment = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment <= 0) {
    return [];
  }

  const sortedOffsets = [...new Set(reminderDays)].sort((left, right) => left - right);
  return sortedOffsets.filter(
    (offset) => !reminderSentOffsets.includes(offset) && hoursUntilAppointment <= offset * 24
  );
}

export async function runScheduledAppointmentReminderCycle() {
  let context;
  try {
    context = await getReminderContext();
  } catch {
    return;
  }

  const { config, em, preferences, to } = context;

  const scheduledAppointments = await em.find(
    ScheduledAppointment,
    {
      status: { $in: ['scheduled', 'confirmed'] },
    },
    { orderBy: { scheduledAt: 'asc' } }
  );

  const now = new Date();

  for (const scheduledAppointment of scheduledAppointments) {
    const dueOffsets = pickDueReminderOffsets(
      preferences.reminderDays ?? [7, 3, 1],
      scheduledAppointment.reminderSentOffsets,
      scheduledAppointment.scheduledAt,
      now
    );

    if (dueOffsets.length === 0) {
      continue;
    }

    const mostSpecificOffset = dueOffsets[0];

    try {
      await sendMetaTemplateReminder(to, scheduledAppointment, config);
      scheduledAppointment.reminderSentOffsets = [
        ...new Set([...scheduledAppointment.reminderSentOffsets, ...dueOffsets]),
      ].sort((left, right) => left - right);
      scheduledAppointment.lastWhatsappReminderAt = new Date();
      scheduledAppointment.lastWhatsappReminderError = undefined;
      await em.flush();
    } catch (error) {
      scheduledAppointment.lastWhatsappReminderError =
        `${
          error instanceof Error ? error.message.slice(0, 450) : String(error).slice(0, 450)
        } (ventana ${mostSpecificOffset}d)`;
      await em.flush();
    }
  }
}

export async function sendScheduledAppointmentReminderNow(scheduledAppointmentId: string) {
  const { config, em, to } = await getReminderContext();
  const scheduledAppointment = await em.findOne(ScheduledAppointment, { id: scheduledAppointmentId });

  if (!scheduledAppointment) {
    return null;
  }

  await sendMetaTemplateReminder(to, scheduledAppointment, config);
  scheduledAppointment.lastWhatsappReminderAt = new Date();
  scheduledAppointment.lastWhatsappReminderError = undefined;
  await em.flush();

  return scheduledAppointment;
}

export function startScheduledAppointmentReminderWorker() {
  const config = getMetaWhatsappConfig();
  if (!config) {
    return;
  }

  void runScheduledAppointmentReminderCycle();
  const configuredInterval = Number(process.env.WHATSAPP_REMINDER_INTERVAL_MS);
  const intervalMs =
    Number.isFinite(configuredInterval) && configuredInterval >= 30_000
      ? configuredInterval
      : DEFAULT_REMINDER_INTERVAL_MS;
  const timer = setInterval(() => {
    void runScheduledAppointmentReminderCycle();
  }, intervalMs);

  timer.unref?.();
}
