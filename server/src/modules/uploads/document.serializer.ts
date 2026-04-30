import { Document } from '../../entities/Document.js';
import type { AppointmentDocumentDto } from '../../../../shared/contracts/http.js';

export function serializeAppointmentDocument(document: Document): AppointmentDocumentDto {
  return {
    id: document.id,
    type: document.type,
    name: document.name,
    date: document.date.toISOString(),
    fileUrl:
      document.storageBucket && document.storageKey
        ? `/api/documents/${document.id}/file`
        : document.fileUrl,
    aiSummary: document.aiSummary,
    aiSummaryStatus: document.aiSummaryStatus,
    aiSummaryError: document.aiSummaryError,
    aiSummaryUpdatedAt: document.aiSummaryUpdatedAt?.toISOString(),
    aiSummaryProvider: document.aiSummaryProvider,
    aiSummaryModel: document.aiSummaryModel,
    aiSummaryLastAction: document.aiSummaryLastAction,
  };
}
