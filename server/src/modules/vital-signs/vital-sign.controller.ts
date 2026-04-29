import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import { parseVitalSignInput } from './vital-sign.schemas.js';
import { createVitalSign, deleteVitalSign, listVitalSigns } from './vital-sign.service.js';

export async function getVitalSigns(_req: Request, res: Response, next: NextFunction) {
  try {
    const vitalSigns = await listVitalSigns();
    res.json({ vitalSigns });
  } catch (error) {
    next(error);
  }
}

export async function postVitalSign(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseVitalSignInput(req.body);
    const vitalSign = await createVitalSign(input);
    return res.status(201).json({ vitalSign });
  } catch (error) {
    return next(error);
  }
}

export async function removeVitalSign(req: Request, res: Response, next: NextFunction) {
  try {
    const vitalSignId = getRouteId(req.params.id);

    if (!vitalSignId) {
      return res.status(400).json({ error: 'Invalid vital sign id' });
    }

    const deleted = await deleteVitalSign(vitalSignId);

    if (!deleted) {
      return res.status(404).json({ error: 'Vital sign not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
