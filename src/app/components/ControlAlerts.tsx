import { AlertCircle, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface Control {
  id: string;
  date: Date;
  specialty: string;
  doctor: string;
  type: string;
  relatedAppointmentId: string;
}

interface ControlAlertsProps {
  controls: Control[];
  onControlClick: (control: Control) => void;
}

export function ControlAlerts({ controls, onControlClick }: ControlAlertsProps) {
  const now = new Date();
  const urgentControls = [...controls]
    .filter((control) => new Date(control.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((control) => differenceInDays(new Date(control.date), now) <= 7);

  if (urgentControls.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-2">¡Controles Médicos Próximos!</h3>
          <div className="space-y-2">
            {urgentControls.slice(0, 3).map((control) => {
              const daysUntil = differenceInDays(new Date(control.date), now);
              const urgencyColor = daysUntil <= 3 ? 'text-red-700' : 'text-orange-700';

              return (
                <button
                  key={control.id}
                  onClick={() => onControlClick(control)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{control.specialty}</p>
                      <p className="text-sm text-gray-600">{control.doctor} - {control.type}</p>
                    </div>
                    <div className={`text-right ${urgencyColor}`}>
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock className="w-4 h-4" />
                        {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                      </div>
                      <p className="text-xs mt-1">
                        {new Date(control.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
