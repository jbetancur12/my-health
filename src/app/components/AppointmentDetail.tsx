import { X, Calendar, User, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TagDisplay, AppointmentTag } from './TagManager';

interface Document {
  id: string;
  type: 'historia_clinica' | 'orden_procedimiento' | 'orden_medicamento' | 'orden_control' | 'laboratorio';
  name: string;
  date: Date;
  file?: File;
  fileUrl?: string;
}

interface Appointment {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  documents: Document[];
  notes?: string;
  tags?: string[];
}

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose: () => void;
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

export function AppointmentDetail({ appointment, onClose, tags = [], onViewFile }: AppointmentDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalles de la Cita</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{appointment.specialty}</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5 text-gray-400" />
                <span>{appointment.doctor}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
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
              <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
              <p className="text-gray-600">{appointment.notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos ({appointment.documents.length})
            </h4>

            <div className="space-y-2">
              {appointment.documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${documentTypeColors[document.type]}`}>
                          {documentTypeLabels[document.type]}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{document.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(document.date, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    {document.fileUrl && (
                      <button
                        onClick={() => onViewFile?.(document.fileUrl!, document.name)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Ver archivo"
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
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
