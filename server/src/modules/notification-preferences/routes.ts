import express from 'express';
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
} from './notification-preference.controller.js';

export function registerNotificationPreferenceRoutes(app: express.Express) {
  app.get('/api/notification-preferences', fetchNotificationPreferences);
  app.put('/api/notification-preferences', saveNotificationPreferences);
}
