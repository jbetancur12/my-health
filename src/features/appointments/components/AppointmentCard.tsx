import { Calendar, FileText, User, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MouseEvent } from 'react';
import type { Appointment, Document } from '../../../shared/api/contracts';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  onEdit: () => void;
}

const documentTypeLabels: Record<Document['type'], string> = {
  historia_clinica: 'Historia Clínica',
  orden_procedimiento: 'Orden de Procedimiento',
  orden_medicamento: 'Orden de Medicamento',
  orden_control: 'Orden de Control',
  laboratorio: 'Laboratorio',
};

export function AppointmentCard({ appointment, onClick, onEdit }: AppointmentCardProps) {
  const handleEdit = (event: MouseEvent) => {
    event.stopPropagation();
    onEdit();
  };

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{appointment.specialty}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <User className="w-4 h-4" />
            <span>{appointment.doctor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{format(appointment.date, "d 'de' MMMM, yyyy", { locale: es })}</span>
          </div>
        </div>
        <button onClick={handleEdit} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="Editar cita">
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {appointment.documents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FileText className="w-4 h-4" />
            <span>{appointment.documents.length} documento{appointment.documents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {appointment.documents.map((document) => (
              <span key={document.id} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {documentTypeLabels[document.type]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
