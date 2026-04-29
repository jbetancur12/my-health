import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { TrendingUp, Calendar as CalendarIcon, FileText, Activity, Pill } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { Appointment, Medication } from '../../../shared/api/contracts';

interface DashboardProps {
  appointments: Appointment[];
  medications: Medication[];
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

export function Dashboard({ appointments, medications }: DashboardProps) {
  const stats = useMemo(() => {
    const last30Days = appointments.filter((appointment) => {
      const daysAgo =
        (new Date().getTime() - new Date(appointment.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30 && daysAgo >= 0;
    });

    const specialtyCounts = appointments.reduce(
      (acc, appointment) => {
        acc[appointment.specialty] = (acc[appointment.specialty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const specialtyData = Object.entries(specialtyCounts)
      .map(([name, value], index) => ({ name, value, id: `${name}-${index}` }))
      .sort((a, b) => b.value - a.value);

    const monthlyMap = new Map<string, { name: string; citas: number; sortKey: string }>();
    appointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayName = date.toLocaleDateString('es', { year: 'numeric', month: 'short' });
      const existing = monthlyMap.get(sortKey);
      if (existing) {
        existing.citas += 1;
      } else {
        monthlyMap.set(sortKey, { name: displayName, citas: 1, sortKey });
      }
    });

    const monthlyChartData = Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6)
      .map(({ name, citas, sortKey }) => ({ name, citas, id: sortKey }));

    return {
      totalAppointments: appointments.length,
      recentAppointments: last30Days.length,
      totalDocs: appointments.reduce((sum, appointment) => sum + appointment.documents.length, 0),
      totalSpecialties: Object.keys(specialtyCounts).length,
      activeMeds: medications.filter((medication) => medication.active).length,
      specialtyData,
      monthlyChartData,
    };
  }, [appointments, medications]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Control</h2>
        <p className="text-gray-600">Resumen de tu historial médico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          icon={<CalendarIcon className="w-8 h-8 opacity-80" />}
          value={stats.totalAppointments}
          label="Total de Citas"
          detail={`${stats.recentAppointments} en los últimos 30 días`}
          colors="from-blue-500 to-blue-600"
        />
        <GradientCard
          icon={<FileText className="w-8 h-8 opacity-80" />}
          value={stats.totalDocs}
          label="Documentos"
          detail="Archivos médicos guardados"
          colors="from-green-500 to-green-600"
        />
        <GradientCard
          icon={<Activity className="w-8 h-8 opacity-80" />}
          value={stats.totalSpecialties}
          label="Especialidades"
          detail="Áreas médicas atendidas"
          colors="from-purple-500 to-purple-600"
        />
        <GradientCard
          icon={<Pill className="w-8 h-8 opacity-80" />}
          value={stats.activeMeds}
          label="Medicamentos"
          detail="Actualmente activos"
          colors="from-orange-500 to-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Citas por Mes
          </h3>
          {stats.monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.monthlyChartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="citas"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos suficientes
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Distribución por Especialidad
          </h3>
          {stats.specialtyData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.specialtyData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {stats.specialtyData.map((entry, index) => (
                      <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.specialtyData.slice(0, 6).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos suficientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GradientCard({
  icon,
  value,
  label,
  detail,
  colors,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  detail: string;
  colors: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${colors} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-white/80">{label}</p>
      <p className="text-sm text-white/70 mt-1">{detail}</p>
    </div>
  );
}
