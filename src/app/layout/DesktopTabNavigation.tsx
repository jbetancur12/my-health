import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  Calendar as CalendarIcon,
  Clock,
  Download,
  FileText,
  Pill,
  Search,
  Stethoscope,
  Syringe,
  Upload,
  User,
} from 'lucide-react';
import type { AppTab } from '../types';

interface DesktopTabNavigationProps {
  activeTab: AppTab;
  controlsCount: number;
  onTabChange: (tab: AppTab) => void;
}

export function DesktopTabNavigation({
  activeTab,
  controlsCount,
  onTabChange,
}: DesktopTabNavigationProps) {
  return (
    <div className="hidden gap-2 overflow-x-auto border-b border-gray-200 md:flex">
      <TabButton
        icon={<BarChart3 className="h-4 w-4" />}
        active={activeTab === 'dashboard'}
        onClick={() => onTabChange('dashboard')}
        label="Dashboard"
      />
      <TabButton
        icon={<Stethoscope className="h-4 w-4" />}
        active={activeTab === 'appointments'}
        onClick={() => onTabChange('appointments')}
        label="Citas Médicas"
      />
      <TabButton
        icon={<CalendarIcon className="h-4 w-4" />}
        active={activeTab === 'controls'}
        onClick={() => onTabChange('controls')}
        label={`Controles${controlsCount > 0 ? ` (${controlsCount})` : ''}`}
      />
      <TabButton
        icon={<Pill className="h-4 w-4" />}
        active={activeTab === 'medications'}
        onClick={() => onTabChange('medications')}
        label="Medicamentos"
      />
      <TabButton
        icon={<CalendarIcon className="h-4 w-4" />}
        active={activeTab === 'calendar'}
        onClick={() => onTabChange('calendar')}
        label="Calendario"
      />
      <TabButton
        icon={<Bell className="h-4 w-4" />}
        active={activeTab === 'settings'}
        onClick={() => onTabChange('settings')}
        label="Configuración"
      />
      <TabButton
        icon={<Download className="h-4 w-4" />}
        active={activeTab === 'export'}
        onClick={() => onTabChange('export')}
        label="Exportar"
      />
      <TabButton
        icon={<Upload className="h-4 w-4" />}
        active={activeTab === 'import'}
        onClick={() => onTabChange('import')}
        label="Importar"
      />
      <TabButton
        icon={<User className="h-4 w-4" />}
        active={activeTab === 'profile'}
        onClick={() => onTabChange('profile')}
        label="Perfil Médico"
      />
      <TabButton
        icon={<Activity className="h-4 w-4" />}
        active={activeTab === 'vitals'}
        onClick={() => onTabChange('vitals')}
        label="Signos Vitales"
      />
      <TabButton
        icon={<Syringe className="h-4 w-4" />}
        active={activeTab === 'vaccines'}
        onClick={() => onTabChange('vaccines')}
        label="Vacunas"
      />
      <TabButton
        icon={<Clock className="h-4 w-4" />}
        active={activeTab === 'timeline'}
        onClick={() => onTabChange('timeline')}
        label="Timeline"
      />
      <TabButton
        icon={<Search className="h-4 w-4" />}
        active={activeTab === 'search'}
        onClick={() => onTabChange('search')}
        label="Buscar"
      />
      <TabButton
        icon={<Calculator className="h-4 w-4" />}
        active={activeTab === 'calculators'}
        onClick={() => onTabChange('calculators')}
        label="Calculadoras"
      />
      <TabButton
        icon={<FileText className="h-4 w-4" />}
        active={activeTab === 'pdf'}
        onClick={() => onTabChange('pdf')}
        label="Generar PDF"
      />
    </div>
  );
}

function TabButton({
  icon,
  active,
  onClick,
  label,
}: {
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 font-medium transition-colors ${
        active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
