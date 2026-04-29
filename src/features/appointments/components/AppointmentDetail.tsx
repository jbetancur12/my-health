import {
  X,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  LoaderCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { TagDisplay } from './TagManager';
import type { Appointment, AppointmentTag, Document } from '../../../shared/api/contracts';

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose: () => void;
  onDelete: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  tags?: AppointmentTag[];
  onViewFile?: (url: string, name: string) => void;
  onRetryDocumentSummary?: (documentId: string) => void | Promise<unknown>;
}

const documentTypeLabels: Record<Document['type'], string> = {
  historia_clinica: 'Historia Clínica',
  orden_procedimiento: 'Orden de Procedimiento',
  orden_medicamento: 'Orden de Medicamento',
  orden_control: 'Orden de Control',
  laboratorio: 'Laboratorio',
};

const documentTypeColors: Record<Document['type'], string> = {
  historia_clinica: 'bg-purple-100 text-purple-700',
  orden_procedimiento: 'bg-blue-100 text-blue-700',
  orden_medicamento: 'bg-green-100 text-green-700',
  orden_control: 'bg-orange-100 text-orange-700',
  laboratorio: 'bg-pink-100 text-pink-700',
};

function formatSummaryLines(summary: string) {
  return summary
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\*\*/g, ''));
}

export function AppointmentDetail({
  appointment,
  onClose,
  onDelete,
  onEdit,
  tags = [],
  onViewFile,
  onRetryDocumentSummary,
}: AppointmentDetailProps) {
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});

  const toggleSummary = (documentId: string) => {
    setExpandedSummaries((current) => ({
      ...current,
      [documentId]: !current[documentId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <h2 className="text-xl font-semibold text-gray-900">Detalles de la Cita</h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-2xl font-semibold text-gray-900">{appointment.specialty}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(appointment)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(appointment)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <User className="h-5 w-5 text-gray-400" />
                <span>{appointment.doctor}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{format(appointment.date, "d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>

              {appointment.tags && appointment.tags.length > 0 && (
                <div className="pt-2">
                  <TagDisplay tags={tags} appointmentTags={appointment.tags} />
                </div>
              )}
            </div>
          </div>

          {appointment.notes && (
            <div className="mb-6">
              <h4 className="mb-2 font-semibold text-gray-900">Notas</h4>
              <p className="text-gray-600">{appointment.notes}</p>
            </div>
          )}

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="h-5 w-5" />
              Documentos ({appointment.documents.length})
            </h4>

            <div className="space-y-2">
              {appointment.documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${documentTypeColors[document.type]}`}
                        >
                          {documentTypeLabels[document.type]}
                        </span>
                      </div>
                      <p className="mb-1 font-medium text-gray-900">{document.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(document.date, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>

                    {document.fileUrl ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => onViewFile?.(document.fileUrl!, document.name)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                          title="Ver archivo"
                        >
                          <Eye className="h-4 w-4" />
                          Ver archivo
                        </button>
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          Abrir
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin archivo subido</span>
                    )}
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <button
                      type="button"
                      onClick={() => toggleSummary(document.id)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span>Resumen IA</span>
                      </div>
                      {expandedSummaries[document.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {expandedSummaries[document.id] &&
                    document.aiSummaryStatus === 'completed' &&
                    document.aiSummary ? (
                      <div className="space-y-2">
                        <div className="space-y-2">
                          {formatSummaryLines(document.aiSummary).map((line, index) => {
                            const separatorIndex = line.indexOf(':');
                            const hasLabel = separatorIndex > 0;
                            const label = hasLabel ? line.slice(0, separatorIndex).trim() : '';
                            const content = hasLabel ? line.slice(separatorIndex + 1).trim() : line;

                            return (
                              <div
                                key={`${document.id}-summary-${index}`}
                                className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-gray-700"
                              >
                                {hasLabel ? (
                                  <>
                                    <span className="font-semibold text-gray-900">{label}:</span>{' '}
                                    <span>{content}</span>
                                  </>
                                ) : (
                                  <span>{content}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {document.aiSummaryUpdatedAt && (
                          <p className="text-xs text-gray-500">
                            Actualizado el{' '}
                            {format(document.aiSummaryUpdatedAt, "d 'de' MMMM, yyyy h:mm a", {
                              locale: es,
                            })}
                          </p>
                        )}
                      </div>
                    ) : null}

                    {expandedSummaries[document.id] &&
                      (document.aiSummaryStatus === 'pending' ||
                        document.aiSummaryStatus === 'processing') && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-blue-700">
                        <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin" />
                        <p>
                          Estamos procesando este archivo para generar un resumen automático.
                          Mantén abierta esta vista o vuelve a entrar en unos segundos.
                        </p>
                      </div>
                    )}

                    {expandedSummaries[document.id] && document.aiSummaryStatus === 'failed' && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-start gap-2 text-sm text-amber-700">
                          <AlertCircle className="mt-0.5 h-4 w-4" />
                          <div>
                            <p className="font-medium">No pudimos generar el resumen.</p>
                            {document.aiSummaryError && (
                              <p className="mt-1 text-amber-700/90">{document.aiSummaryError}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRetryDocumentSummary?.(document.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reintentar resumen
                        </button>
                      </div>
                    )}

                    {expandedSummaries[document.id] && document.aiSummaryStatus === 'idle' && (
                      <p className="mt-3 text-sm text-gray-500">
                        Este documento aún no tiene un resumen automático disponible.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
