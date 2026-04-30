import express from 'express';
import {
  getScheduledAppointments,
  postScheduledAppointment,
  postScheduledAppointmentConversion,
  putScheduledAppointment,
  removeScheduledAppointment,
} from './scheduled-appointment.controller.js';

export function registerScheduledAppointmentRoutes(app: express.Express) {
  app.get('/api/scheduled-appointments', getScheduledAppointments);
  app.post('/api/scheduled-appointments', postScheduledAppointment);
  app.put('/api/scheduled-appointments/:id', putScheduledAppointment);
  app.delete('/api/scheduled-appointments/:id', removeScheduledAppointment);
  app.post('/api/scheduled-appointments/:id/convert', postScheduledAppointmentConversion);
}
