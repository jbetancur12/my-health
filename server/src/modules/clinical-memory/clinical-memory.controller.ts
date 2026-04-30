import type { NextFunction, Request, Response } from 'express';
import { getClinicalMemory } from './clinical-memory.service.js';

export async function fetchClinicalMemory(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const clinicalMemory = await getClinicalMemory();
    res.json({ clinicalMemory });
  } catch (error) {
    next(error);
  }
}
