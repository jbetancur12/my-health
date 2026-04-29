import type { NextFunction, Request, Response } from 'express';
import { parseControlInput } from './control.schemas.js';
import { createControl, listControls } from './control.service.js';

export async function getControls(_req: Request, res: Response, next: NextFunction) {
  try {
    const controls = await listControls();
    res.json({ controls });
  } catch (error) {
    next(error);
  }
}

export async function postControl(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseControlInput(req.body);
    const control = await createControl(input);

    if (!control) {
      return res.status(404).json({ error: 'Related appointment not found' });
    }

    return res.status(201).json({ control });
  } catch (error) {
    return next(error);
  }
}
