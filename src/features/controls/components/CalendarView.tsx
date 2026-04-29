import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Stethoscope } from 'lucide-react';
import type { Appointment, Control } from '../../../shared/api/contracts';

interface CalendarViewProps {
  appointments: Appointment[];
  controls: Control[];
  onAppointmentClick: (appointment: Appointment) => void;
  onControlClick: (control: Control) => void;
}

export function CalendarView({ appointments, controls, onAppointmentClick, onControlClick }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [value, setValue] = useState<Date>(new Date());

  const eventsOnDate = useMemo(() => ({
    appointments: appointments.filter((appointment) => isSameDay(new Date(appointment.date), selectedDate)),
    controls: controls.filter((control) => isSameDay(new Date(control.date), selectedDate)),
  }), [selectedDate, appointments, controls]);

  const tileContent = ({ date }: { date: Date }) => {
    const hasAppointment = appointments.some((appointment) => isSameDay(new Date(appointment.date), date));
    const hasControl = controls.some((control) => isSameDay(new Date(control.date), date));

    if (!hasAppointment && !hasControl) return null;

    return (
      <div className="flex justify-center gap-1 mt-1">
        {hasAppointment && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        {hasControl && <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Calendario Médico</h2>
              <p className="text-sm text-gray-600">Vista mensual de citas y controles</p>
            </div>
          </div>

          <div className="calendar-container">
            <Calendar
              onChange={(date) => {
                setValue(date as Date);
                setSelectedDate(date as Date);
              }}
              value={value}
              tileContent={tileContent}
              tileClassName={({ date }) => (isSameDay(date, selectedDate) ? 'selected-date' : '')}
              locale="es-ES"
              className="w-full border-0 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200">
            <LegendDot color="bg-blue-600" label="Citas médicas" />
            <LegendDot color="bg-orange-600" label="Controles programados" />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
          </h3>

          {eventsOnDate.appointments.length === 0 && eventsOnDate.controls.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay eventos este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventsOnDate.appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => onAppointmentClick(appointment)}
                  className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{appointment.specialty}</p>
                      <p className="text-sm text-blue-700">{appointment.doctor}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {appointment.documents.length} documento{appointment.documents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {eventsOnDate.controls.map((control) => (
                <button
                  key={control.id}
                  onClick={() => onControlClick(control)}
                  className="w-full text-left p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">{control.specialty}</p>
                      <p className="text-sm text-orange-700">{control.type}</p>
                      <p className="text-xs text-orange-600 mt-1">{control.doctor}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .calendar-container .react-calendar {
          border: none;
          font-family: inherit;
          width: 100%;
        }
        .calendar-container .react-calendar__tile {
          padding: 1rem 0.5rem;
          position: relative;
          border-radius: 0.5rem;
        }
        .calendar-container .react-calendar__tile:enabled:hover {
          background-color: #eff6ff;
        }
        .calendar-container .react-calendar__tile--active {
          background-color: #3b82f6 !important;
          color: white;
        }
        .calendar-container .react-calendar__tile--now {
          background-color: #dbeafe;
        }
        .calendar-container .react-calendar__navigation button {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }
        .calendar-container .react-calendar__navigation button:enabled:hover {
          background-color: #f3f4f6;
          border-radius: 0.5rem;
        }
        .calendar-container .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
        }
        .calendar-container .selected-date {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
