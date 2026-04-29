import type { NextFunction, Request, Response } from 'express';
import { getRouteId } from '../shared/http.js';
import { parseControlInput } from './control.schemas.js';
import { createControl, deleteControl, listControls, updateControl } from './control.service.js';

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

export async function putControl(req: Request, res: Response, next: NextFunction) {
  try {
    const controlId = getRouteId(req.params.id);
    if (!controlId) {
      return res.status(400).json({ error: 'Invalid control id' });
    }

    const input = parseControlInput(req.body);
    const control = await updateControl(controlId, input);

    if (!control) {
      return res.status(404).json({ error: 'Control or related appointment not found' });
    }

    return res.json({ control });
  } catch (error) {
    return next(error);
  }
}

export async function removeControl(req: Request, res: Response, next: NextFunction) {
  try {
    const controlId = getRouteId(req.params.id);
    if (!controlId) {
      return res.status(400).json({ error: 'Invalid control id' });
    }

    const removed = await deleteControl(controlId);

    if (!removed) {
      return res.status(404).json({ error: 'Control not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
