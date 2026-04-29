import type { ReactNode } from 'react';
import { AlertCircle, FileSearch, RefreshCcw } from 'lucide-react';

type FeatureStateVariant = 'empty' | 'error' | 'loading';

interface FeatureStatePanelProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  message: string;
  title: string;
  variant: FeatureStateVariant;
}

export function FeatureStatePanel({
  action,
  icon,
  message,
  title,
  variant,
}: FeatureStatePanelProps) {
  if (variant === 'loading') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    );
  }

  const defaultIcon =
    variant === 'error' ? (
      <AlertCircle className="h-10 w-10 text-red-500" />
    ) : (
      <FileSearch className="h-10 w-10 text-gray-300" />
    );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
        {icon ?? defaultIcon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-gray-500">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
