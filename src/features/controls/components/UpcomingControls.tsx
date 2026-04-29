import { Calendar, Clock, User, Bell } from 'lucide-react';
import { format, isFuture, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Control } from '../../../shared/api/contracts';

interface UpcomingControlsProps {
  controls: Control[];
  onControlClick: (control: Control) => void;
}

export function UpcomingControls({ controls, onControlClick }: UpcomingControlsProps) {
  const upcomingControls = controls
    .filter(c => isFuture(c.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const pastControls = controls
    .filter(c => isPast(c.date))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const getUrgencyColor = (date: Date) => {
    const days = differenceInDays(date, new Date());
    if (days <= 7) return 'border-l-4 border-l-red-500 bg-red-50';
    if (days <= 30) return 'border-l-4 border-l-orange-500 bg-orange-50';
    return 'border-l-4 border-l-blue-500 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {upcomingControls.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Próximos Controles</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {upcomingControls.length}
            </span>
          </div>

          <div className="space-y-3">
            {upcomingControls.map(control => {
              const daysUntil = differenceInDays(control.date, new Date());
              return (
                <div
                  key={control.id}
                  onClick={() => onControlClick(control)}
                  className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getUrgencyColor(control.date)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{control.type}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{control.doctor} - {control.specialty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(control.date, "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span>{daysUntil} día{daysUntil !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastControls.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Controles Vencidos</h3>
          <div className="space-y-3">
            {pastControls.map(control => (
              <div
                key={control.id}
                onClick={() => onControlClick(control)}
                className="p-4 bg-gray-100 border-l-4 border-l-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-700 mb-1">{control.type}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{control.doctor} - {control.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(control.date, "d 'de' MMMM, yyyy", { locale: es })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {controls.length === 0 && (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay controles programados</p>
        </div>
      )}
    </div>
  );
}
