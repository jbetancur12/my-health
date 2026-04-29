import express from 'express';
import { getTags, postTag } from './tag.controller.js';

export function registerTagRoutes(app: express.Express) {
  app.get('/api/tags', getTags);
  app.post('/api/tags', postTag);
}
