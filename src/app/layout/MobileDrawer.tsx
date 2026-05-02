import { useState } from 'react';
import {
  Activity,
  Bell,
  Calculator,
  Clock,
  Download,
  FileText,
  Menu,
  Pill,
  Syringe,
  Upload,
  X,
} from 'lucide-react';
import type { AppTab } from '../types';

interface MobileDrawerProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function MobileDrawer({ activeTab, onTabChange }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: Array<{ id: AppTab; icon: typeof Clock; label: string; badge?: number }> = [
    { id: 'controls', icon: Clock, label: 'Controles', badge: 0 },
    { id: 'medications', icon: Pill, label: 'Medicamentos' },
    { id: 'vaccines', icon: Syringe, label: 'Vacunas' },
    { id: 'vitals', icon: Activity, label: 'Signos Vitales' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
    { id: 'calculators', icon: Calculator, label: 'Calculadoras' },
    { id: 'pdf', icon: FileText, label: 'Generar PDF' },
    { id: 'export', icon: Download, label: 'Exportar' },
    { id: 'import', icon: Upload, label: 'Importar' },
    { id: 'settings', icon: Bell, label: 'Configuración' },
  ];

  function handleItemClick(id: AppTab) {
    onTabChange(id);
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-4 z-40 rounded-lg border border-gray-200 bg-white p-2 shadow-lg md:hidden"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <div
        className={`fixed bottom-0 right-0 top-0 z-50 w-80 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <div className="text-white">
              <h2 className="text-lg font-bold">Menú</h2>
              <p className="text-xs text-blue-100">Más opciones</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-center text-xs text-gray-500">VitaCita v4.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
