import express from 'express';
import { getAppointments, postAppointment, putAppointment } from './appointment.controller.js';

export function registerAppointmentRoutes(app: express.Express) {
  app.get('/api/appointments', getAppointments);
  app.post('/api/appointments', postAppointment);
  app.put('/api/appointments/:id', putAppointment);
}
