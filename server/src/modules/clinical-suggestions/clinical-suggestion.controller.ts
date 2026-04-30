import type { NextFunction, Request, Response } from 'express';
import {
  listClinicalSuggestions,
  updateClinicalSuggestionStatus,
} from './clinical-suggestion.service.js';
import { parseClinicalSuggestionStatus } from './clinical-suggestion.schemas.js';

export async function fetchClinicalSuggestions(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const clinicalSuggestions = await listClinicalSuggestions();
    res.json({ clinicalSuggestions });
  } catch (error) {
    next(error);
  }
}

export async function patchClinicalSuggestionStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = String(req.params.id ?? '');
    if (!id) {
      return res.status(400).json({ error: 'Suggestion id is required' });
    }

    const status = parseClinicalSuggestionStatus(req.body?.status);
    const clinicalSuggestion = await updateClinicalSuggestionStatus(id, status);

    if (!clinicalSuggestion) {
      return res.status(404).json({ error: 'Clinical suggestion not found' });
    }

    return res.json({ clinicalSuggestion });
  } catch (error) {
    next(error);
  }
}
