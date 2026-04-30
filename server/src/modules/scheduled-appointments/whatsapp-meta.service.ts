import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NotificationPreference } from '../../entities/NotificationPreference.js';
import { ScheduledAppointment } from '../../entities/ScheduledAppointment.js';
import { getOrm } from '../../orm.js';

const DEFAULT_META_GRAPH_API_VERSION = 'v23.0';

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
    throw new Error(`Meta WhatsApp respondió ${response.status}: ${errorText}`);
  }
}

function pickDueReminderOffset(
  reminderDays: number[],
  reminderSentOffsets: number[],
  scheduledAt: Date,
  now: Date
) {
  const hoursUntilAppointment = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment <= 0) {
    return null;
  }

  const sortedOffsets = [...new Set(reminderDays)].sort((left, right) => left - right);
  return (
    sortedOffsets.find(
      (offset) =>
        !reminderSentOffsets.includes(offset) && hoursUntilAppointment <= offset * 24
    ) ?? null
  );
}

export async function runScheduledAppointmentReminderCycle() {
  const config = getMetaWhatsappConfig();
  if (!config) {
    return;
  }

  const orm = await getOrm();
  const em = orm.em.fork();
  const preferences = await em.findOne(NotificationPreference, {}, { orderBy: { createdAt: 'asc' } });

  if (!preferences?.whatsappEnabled || !preferences.whatsappOptIn || !preferences.phone) {
    return;
  }

  const to = normalizeWhatsappPhone(preferences.phone);
  if (!to) {
    return;
  }

  const scheduledAppointments = await em.find(
    ScheduledAppointment,
    {
      status: { $in: ['scheduled', 'confirmed'] },
    },
    { orderBy: { scheduledAt: 'asc' } }
  );

  const now = new Date();

  for (const scheduledAppointment of scheduledAppointments) {
    const dueOffset = pickDueReminderOffset(
      preferences.reminderDays ?? [7, 3, 1],
      scheduledAppointment.reminderSentOffsets,
      scheduledAppointment.scheduledAt,
      now
    );

    if (dueOffset === null) {
      continue;
    }

    try {
      await sendMetaTemplateReminder(to, scheduledAppointment, config);
      scheduledAppointment.reminderSentOffsets = [
        ...new Set([...scheduledAppointment.reminderSentOffsets, dueOffset]),
      ].sort((left, right) => left - right);
      scheduledAppointment.lastWhatsappReminderAt = new Date();
      scheduledAppointment.lastWhatsappReminderError = undefined;
      await em.flush();
    } catch (error) {
      scheduledAppointment.lastWhatsappReminderError =
        error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
      await em.flush();
    }
  }
}

export function startScheduledAppointmentReminderWorker() {
  const config = getMetaWhatsappConfig();
  if (!config) {
    return;
  }

  void runScheduledAppointmentReminderCycle();
  const intervalMs = 15 * 60 * 1000;
  const timer = setInterval(() => {
    void runScheduledAppointmentReminderCycle();
  }, intervalMs);

  timer.unref?.();
}
