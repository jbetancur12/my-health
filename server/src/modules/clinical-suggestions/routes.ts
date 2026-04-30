import express from 'express';
import {
  fetchClinicalSuggestions,
  patchClinicalSuggestionStatus,
} from './clinical-suggestion.controller.js';

export function registerClinicalSuggestionRoutes(app: express.Express) {
  app.get('/api/clinical-suggestions', fetchClinicalSuggestions);
  app.patch('/api/clinical-suggestions/:id', patchClinicalSuggestionStatus);
}
