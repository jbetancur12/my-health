import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import { parseMedicationInput, parseMedicationUpdateInput } from './medication.schemas.js';
import {
  createMedication,
  deleteMedication,
  listMedications,
  updateMedication,
} from './medication.service.js';

export async function getMedications(_req: Request, res: Response, next: NextFunction) {
  try {
    const medications = await listMedications();
    res.json({ medications });
  } catch (error) {
    next(error);
  }
}

export async function postMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseMedicationInput(req.body);
    const medication = await createMedication(input);
    return res.status(201).json({ medication });
  } catch (error) {
    return next(error);
  }
}

export async function putMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseMedicationUpdateInput(req.body);
    const medicationId = getRouteId(req.params.id);

    if (!medicationId) {
      return res.status(400).json({ error: 'Invalid medication id' });
    }

    const medication = await updateMedication(medicationId, input);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    return res.json({ medication });
  } catch (error) {
    return next(error);
  }
}

export async function removeMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const medicationId = getRouteId(req.params.id);

    if (!medicationId) {
      return res.status(400).json({ error: 'Invalid medication id' });
    }

    const deleted = await deleteMedication(medicationId);

    if (!deleted) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
