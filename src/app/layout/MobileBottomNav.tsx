import { BarChart3, CalendarIcon, Search, Stethoscope, User } from 'lucide-react';
import type { AppTab } from '../types';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const navItems: Array<{ id: AppTab; label: string; icon: typeof BarChart3 }> = [
    { id: 'dashboard', icon: BarChart3, label: 'Inicio' },
    { id: 'appointments', icon: Stethoscope, label: 'Citas' },
    { id: 'calendar', icon: CalendarIcon, label: 'Calendario' },
    { id: 'search', icon: Search, label: 'Buscar' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white safe-area-inset-bottom md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
