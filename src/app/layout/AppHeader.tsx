import { DesktopTabNavigation } from './DesktopTabNavigation';
import type { AppTab } from '../types';

interface AppHeaderProps {
  activeTab: AppTab;
  controlsCount: number;
  onTabChange: (tab: AppTab) => void;
}

export function AppHeader({ activeTab, controlsCount, onTabChange }: AppHeaderProps) {
  return (
    <div className="mb-4 md:mb-6">
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <div className="flex-1 pr-12 md:pr-0">
          <h1 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-3xl">Mi Salud</h1>
          <p className="hidden text-xs text-gray-600 md:block md:text-base">
            Gestiona tus citas, documentos, controles y seguimiento médico desde un solo lugar
          </p>
        </div>
      </div>

      <DesktopTabNavigation activeTab={activeTab} controlsCount={controlsCount} onTabChange={onTabChange} />
    </div>
  );
}
