import { X, Clock, Pill, Syringe, Activity, Bell, Download, Upload, Calculator, FileText, Menu } from 'lucide-react';
import { useState } from 'react';

interface MobileDrawerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileDrawer({ activeTab, onTabChange }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'controls', icon: Clock, label: 'Controles', badge: 0 },
    { id: 'medications', icon: Pill, label: 'Medicamentos' },
    { id: 'vaccines', icon: Syringe, label: 'Vacunas' },
    { id: 'vitals', icon: Activity, label: 'Signos Vitales' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
    { id: 'calculators', icon: Calculator, label: 'Calculadoras' },
    { id: 'pdf', icon: FileText, label: 'Generar PDF' },
    { id: 'export', icon: Download, label: 'Exportar' },
    { id: 'import', icon: Upload, label: 'Importar' },
    { id: 'settings', icon: Bell, label: 'Configuración' }
  ];

  const handleItemClick = (id: string) => {
    onTabChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 right-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="text-white">
              <h2 className="text-lg font-bold">Menú</h2>
              <p className="text-xs text-blue-100">Más opciones</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Archivo Médico Personal v4.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
