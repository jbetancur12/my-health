import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import { parseAppointmentInput, parseAppointmentUpdateInput } from './appointment.schemas.js';
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from './appointment.service.js';

export async function getAppointments(_req: Request, res: Response, next: NextFunction) {
  try {
    const appointments = await listAppointments();
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
}

export async function postAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseAppointmentInput(req.body);
    const appointment = await createAppointment(input);
    return res.status(201).json({ appointment });
  } catch (error) {
    return next(error);
  }
}

export async function putAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseAppointmentUpdateInput(req.body);
    const appointmentId = getRouteId(req.params.id);

    if (!appointmentId) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const appointment = await updateAppointment(appointmentId, input);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.json({ appointment });
  } catch (error) {
    return next(error);
  }
}

export async function removeAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const appointmentId = getRouteId(req.params.id);

    if (!appointmentId) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const removed = await deleteAppointment(appointmentId);

    if (!removed) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
