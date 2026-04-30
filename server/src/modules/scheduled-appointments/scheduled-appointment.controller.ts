import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import {
  parseScheduledAppointmentConvertInput,
  parseScheduledAppointmentInput,
  parseScheduledAppointmentUpdateInput,
} from './scheduled-appointment.schemas.js';
import {
  convertScheduledAppointment,
  createScheduledAppointment,
  deleteScheduledAppointment,
  listScheduledAppointments,
  triggerScheduledAppointmentReminder,
  updateScheduledAppointment,
} from './scheduled-appointment.service.js';

export async function getScheduledAppointments(_req: Request, res: Response, next: NextFunction) {
  try {
    const scheduledAppointments = await listScheduledAppointments();
    res.json({ scheduledAppointments });
  } catch (error) {
    next(error);
  }
}

export async function postScheduledAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseScheduledAppointmentInput(req.body);
    const scheduledAppointment = await createScheduledAppointment(input);
    return res.status(201).json({ scheduledAppointment });
  } catch (error) {
    return next(error);
  }
}

export async function putScheduledAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const scheduledAppointmentId = getRouteId(req.params.id);
    if (!scheduledAppointmentId) {
      return res.status(400).json({ error: 'Invalid scheduled appointment id' });
    }

    const input = parseScheduledAppointmentUpdateInput(req.body);
    const scheduledAppointment = await updateScheduledAppointment(scheduledAppointmentId, input);

    if (!scheduledAppointment) {
      return res.status(404).json({ error: 'Scheduled appointment not found' });
    }

    return res.json({ scheduledAppointment });
  } catch (error) {
    return next(error);
  }
}

export async function removeScheduledAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const scheduledAppointmentId = getRouteId(req.params.id);
    if (!scheduledAppointmentId) {
      return res.status(400).json({ error: 'Invalid scheduled appointment id' });
    }

    const removed = await deleteScheduledAppointment(scheduledAppointmentId);
    if (!removed) {
      return res.status(404).json({ error: 'Scheduled appointment not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function postScheduledAppointmentConversion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const scheduledAppointmentId = getRouteId(req.params.id);
    if (!scheduledAppointmentId) {
      return res.status(400).json({ error: 'Invalid scheduled appointment id' });
    }

    const input = parseScheduledAppointmentConvertInput(req.body);
    const scheduledAppointment = await convertScheduledAppointment(
      scheduledAppointmentId,
      input.appointmentId
    );

    if (!scheduledAppointment) {
      return res.status(404).json({ error: 'Scheduled appointment not found' });
    }

    return res.json({ scheduledAppointment });
  } catch (error) {
    return next(error);
  }
}

export async function postScheduledAppointmentReminder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const scheduledAppointmentId = getRouteId(req.params.id);
    if (!scheduledAppointmentId) {
      return res.status(400).json({ error: 'Invalid scheduled appointment id' });
    }

    const scheduledAppointment = await triggerScheduledAppointmentReminder(scheduledAppointmentId);

    if (!scheduledAppointment) {
      return res.status(404).json({ error: 'Scheduled appointment not found' });
    }

    return res.json({ scheduledAppointment });
  } catch (error) {
    return next(error);
  }
}
