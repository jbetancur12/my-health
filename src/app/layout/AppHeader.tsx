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
          <div className="flex items-center gap-2 md:gap-3">
            {/* Logo VitaCita */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0 md:w-11 md:h-11"
            >
              <rect width="64" height="64" rx="16" fill="#155DFC" />
              <rect x="10" y="18" width="44" height="37" rx="5" fill="white" fillOpacity="0.08" stroke="white" strokeWidth="2.5" />
              <line x1="21" y1="12" x2="21" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="43" y1="12" x2="43" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 24.5 L16 24.5 L19 19 L23 30 L26 20 L29 24.5 L54 24.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="10" y1="31" x2="54" y2="31" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />
              <circle cx="19" cy="40" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="28" cy="40" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="37" cy="40" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="46" cy="40" r="2.5" fill="white" fillOpacity="0.35" />
              <circle cx="19" cy="49" r="2.5" fill="white" fillOpacity="0.35" />
              <circle cx="28" cy="49" r="3.5" fill="white" />
              <circle cx="37" cy="49" r="2.5" fill="white" fillOpacity="0.35" />
              <circle cx="46" cy="49" r="2.5" fill="white" fillOpacity="0.7" />
            </svg>
            <div>
              <h1 className="leading-none text-xl font-bold text-gray-900 md:text-3xl mb-0 md:mb-1">
                VitaCita
              </h1>
              <p className="hidden text-xs text-gray-500 md:block md:text-sm">
                Tu vida médica, organizada
              </p>
            </div>
          </div>
        </div>
      </div>

      <DesktopTabNavigation
        activeTab={activeTab}
        controlsCount={controlsCount}
        onTabChange={onTabChange}
      />
    </div>
  );
}
