import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import { parseVaccineInput } from './vaccine.schemas.js';
import { createVaccine, deleteVaccine, listVaccines } from './vaccine.service.js';

export async function getVaccines(_req: Request, res: Response, next: NextFunction) {
  try {
    const vaccines = await listVaccines();
    res.json({ vaccines });
  } catch (error) {
    next(error);
  }
}

export async function postVaccine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseVaccineInput(req.body);
    const vaccine = await createVaccine(input);
    return res.status(201).json({ vaccine });
  } catch (error) {
    return next(error);
  }
}

export async function removeVaccine(req: Request, res: Response, next: NextFunction) {
  try {
    const vaccineId = getRouteId(req.params.id);

    if (!vaccineId) {
      return res.status(400).json({ error: 'Invalid vaccine id' });
    }

    const deleted = await deleteVaccine(vaccineId);

    if (!deleted) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
