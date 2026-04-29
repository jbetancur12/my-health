import type { NextFunction, Request, Response } from 'express';
import { parseTagInput } from './tag.schemas.js';
import { createTag, listTags } from './tag.service.js';

export async function getTags(_req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await listTags();
    res.json({ tags });
  } catch (error) {
    next(error);
  }
}

export async function postTag(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseTagInput(req.body);
    const tag = await createTag(input);
    return res.status(201).json({ tag });
  } catch (error) {
    return next(error);
  }
}
