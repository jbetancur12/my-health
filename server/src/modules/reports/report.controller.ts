import type { NextFunction, Request, Response } from 'express';
import { parseExecutiveReportInput } from './report.schemas.js';
import { generateExecutiveReport } from './report.service.js';

export async function postExecutiveSummaryReport(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseExecutiveReportInput(req.body);
    const report = await generateExecutiveReport(input);
    res.status(200).json({ report });
  } catch (error) {
    next(error);
  }
}
