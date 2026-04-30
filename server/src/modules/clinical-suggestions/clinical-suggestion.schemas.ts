import {
  ClinicalSuggestionStatus,
  type ClinicalSuggestionStatus as ClinicalSuggestionStatusValue,
} from '../../entities/ClinicalSuggestion.js';
import { ValidationError } from '../shared/validation.js';

export function parseClinicalSuggestionStatus(
  input: unknown
): ClinicalSuggestionStatusValue {
  if (
    input === ClinicalSuggestionStatus.PENDING ||
    input === ClinicalSuggestionStatus.ACCEPTED ||
    input === ClinicalSuggestionStatus.DISMISSED ||
    input === ClinicalSuggestionStatus.POSTPONED
  ) {
    return input;
  }

  throw new ValidationError('Estado de sugerencia clínica inválido.');
}
