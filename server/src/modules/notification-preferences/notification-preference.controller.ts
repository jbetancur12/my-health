import type { NextFunction, Request, Response } from 'express';
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from './notification-preference.service.js';
import { parseNotificationPreferenceInput } from './notification-preference.schemas.js';

export async function fetchNotificationPreferences(_req: Request, res: Response, next: NextFunction) {
  try {
    const notificationPreferences = await getNotificationPreferences();
    res.json({ notificationPreferences });
  } catch (error) {
    next(error);
  }
}

export async function saveNotificationPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseNotificationPreferenceInput(req.body);
    const notificationPreferences = await upsertNotificationPreferences(input);
    res.json({ notificationPreferences });
  } catch (error) {
    next(error);
  }
}
