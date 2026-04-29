import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { ValidationError } from '../modules/shared/validation.js';
import { registerRoutes } from './routes.js';

interface CreateAppOptions {
  clientOrigin: string;
  nodeEnv: string;
  uploadsRoot: string;
}

export function createApp({ clientOrigin, nodeEnv, uploadsRoot }: CreateAppOptions) {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(uploadsRoot));

  registerRoutes({ app, nodeEnv, upload, uploadsRoot });

  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    void next;

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }

    if (nodeEnv !== 'test') {
      console.error(error);
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  });

  return app;
}
