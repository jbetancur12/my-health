import type { ReactNode } from 'react';

interface FloatingActionButtonProps {
  ariaLabel: string;
  icon: ReactNode;
  onClick: () => void;
}

export function FloatingActionButton({ ariaLabel, icon, onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all hover:bg-blue-700 active:scale-95 md:hidden"
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
