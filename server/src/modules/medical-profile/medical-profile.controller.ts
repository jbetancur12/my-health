import type { NextFunction, Request, Response } from 'express';
import { getMedicalProfile, upsertMedicalProfile } from './medical-profile.service.js';
import { parseMedicalProfileInput } from './medical-profile.schemas.js';

export async function fetchMedicalProfile(_req: Request, res: Response, next: NextFunction) {
  try {
    const medicalProfile = await getMedicalProfile();
    res.json({ medicalProfile });
  } catch (error) {
    next(error);
  }
}

export async function saveMedicalProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseMedicalProfileInput(req.body);
    const medicalProfile = await upsertMedicalProfile(input);
    res.json({ medicalProfile });
  } catch (error) {
    next(error);
  }
}
