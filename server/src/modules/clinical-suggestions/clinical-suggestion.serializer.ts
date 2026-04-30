import { ClinicalSuggestion } from '../../entities/ClinicalSuggestion.js';
import type { ClinicalSuggestionDto } from '../../../../shared/contracts/http.js';

export function serializeClinicalSuggestion(
  suggestion: ClinicalSuggestion
): ClinicalSuggestionDto {
  return {
    id: suggestion.id,
    fingerprint: suggestion.fingerprint,
    type: suggestion.type,
    status: suggestion.status,
    confidence: suggestion.confidence,
    title: suggestion.title,
    description: suggestion.description,
    sourceDocumentId: suggestion.sourceDocumentId,
    sourceAppointmentId: suggestion.sourceAppointmentId,
    relatedDocumentIds: suggestion.relatedDocumentIds,
    relatedAppointmentIds: suggestion.relatedAppointmentIds,
    payload: suggestion.payload,
    reviewedAt: suggestion.reviewedAt?.toISOString(),
    createdAt: suggestion.createdAt.toISOString(),
    updatedAt: suggestion.updatedAt.toISOString(),
  };
}
