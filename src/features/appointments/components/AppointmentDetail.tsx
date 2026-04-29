import { X, Calendar, User, FileText, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TagDisplay } from './TagManager';
import type { Appointment, AppointmentTag, Document } from '../../../shared/api/contracts';

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose: () => void;
  onDelete: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  tags?: AppointmentTag[];
  onViewFile?: (url: string, name: string) => void;
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

export function AppointmentDetail({
  appointment,
  onClose,
  onDelete,
  onEdit,
  tags = [],
  onViewFile,
}: AppointmentDetailProps) {
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
