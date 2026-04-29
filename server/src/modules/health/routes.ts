import express from 'express';

export function registerHealthRoutes(app: express.Express, nodeEnv: string) {
  app.get('/health', async (_req, res, next) => {
    try {
      res.json({ status: 'ok', environment: nodeEnv });
    } catch (error) {
      next(error);
    }
  });
}
