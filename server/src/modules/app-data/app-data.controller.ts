import type { NextFunction, Request, Response } from 'express';
import { hasAppDataContent } from '../shared/entity-factories.js';
import { parseAppDataImportInput } from './app-data.schemas.js';
import { importAppData } from './app-data.service.js';

export async function postAppDataImport(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseAppDataImportInput(req.body);

    if (!hasAppDataContent(input)) {
      return res.status(400).json({ error: 'Invalid app data payload' });
    }

    const result = await importAppData(input);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
