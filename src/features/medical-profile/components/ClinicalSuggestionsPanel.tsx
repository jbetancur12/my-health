import type { ReactNode } from 'react';
import {
  CalendarClock,
  Check,
  Clock3,
  FlaskConical,
  Pill,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  ClinicalSuggestion,
  ClinicalSuggestionStatus,
} from '../../../shared/api/contracts';

interface ClinicalSuggestionsPanelProps {
  suggestions: ClinicalSuggestion[];
  onStatusChange: (
    id: string,
    status: ClinicalSuggestionStatus
  ) => void | Promise<unknown>;
  onScheduleSuggestion?: (suggestion: ClinicalSuggestion) => void | Promise<unknown>;
}

const TYPE_META = {
  medication: {
    label: 'Medicamento',
    icon: Pill,
    chipClassName: 'bg-green-100 text-green-800',
  },
  condition: {
    label: 'Patología',
    icon: Stethoscope,
    chipClassName: 'bg-purple-100 text-purple-800',
  },
  follow_up: {
    label: 'Control',
    icon: Clock3,
    chipClassName: 'bg-blue-100 text-blue-800',
  },
  pending_study: {
    label: 'Estudio',
    icon: FlaskConical,
    chipClassName: 'bg-amber-100 text-amber-800',
  },
} as const;

const CONFIDENCE_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
} as const;

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm italic text-gray-400">{text}</p>;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SuggestionCard({
  suggestion,
  actions,
}: {
  suggestion: ClinicalSuggestion;
  actions?: React.ReactNode;
}) {
  const meta = TYPE_META[suggestion.type];
  const Icon = meta.icon;

  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chipClassName}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
              Confianza {CONFIDENCE_LABELS[suggestion.confidence]}
            </span>
          </div>
          <h5 className="mt-3 text-base font-semibold text-gray-900">{suggestion.title}</h5>
          <p className="mt-1 text-sm text-gray-700">{suggestion.description}</p>
          <p className="mt-3 text-xs text-gray-500">
            Última actualización{' '}
            {format(suggestion.updatedAt, "d 'de' MMM yyyy h:mm a", { locale: es })}
          </p>
        </div>
        {actions}
      </div>
    </article>
  );
}

export function ClinicalSuggestionsPanel({
  suggestions,
  onStatusChange,
  onScheduleSuggestion,
}: ClinicalSuggestionsPanelProps) {
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === 'pending');
  const reviewedSuggestions = suggestions.filter((suggestion) => suggestion.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-emerald-950">
              <Sparkles className="h-6 w-6 text-emerald-600" />
              Sugerencias Clínicas Revisables
            </h3>
            <p className="mt-1 text-sm text-emerald-900">
              Aquí la IA propone acciones concretas a partir de los documentos procesados. Nada se
              aplica automáticamente: primero tú decides si aceptarlo, posponerlo o descartarlo.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">
            {pendingSuggestions.length} pendientes
          </span>
        </div>
      </div>

      <Section
        title="Pendientes por revisar"
        description="Estas sugerencias surgieron de documentos recientes o de cambios en la memoria clínica."
      >
        <div className="space-y-4">
          {pendingSuggestions.length === 0 ? (
            <EmptyState text="No hay sugerencias clínicas pendientes en este momento." />
          ) : (
            pendingSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                actions={
                  <div className="flex flex-col gap-2 sm:min-w-[160px]">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      onClick={() => void onStatusChange(suggestion.id, 'accepted')}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                      Aceptar
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                      onClick={() => void onStatusChange(suggestion.id, 'postponed')}
                      type="button"
                    >
                      <Clock3 className="h-4 w-4" />
                      Posponer
                    </button>
                    {suggestion.type === 'follow_up' && onScheduleSuggestion ? (
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-100"
                        onClick={() => void onScheduleSuggestion(suggestion)}
                        type="button"
                      >
                        <CalendarClock className="h-4 w-4" />
                        Programar sugerencia
                      </button>
                    ) : null}
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100"
                      onClick={() => void onStatusChange(suggestion.id, 'dismissed')}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Descartar
                    </button>
                  </div>
                }
              />
            ))
          )}
        </div>
      </Section>

      <Section
        title="Historial de revisión"
        description="Este panel conserva el rastro de lo que ya aceptaste, descartaste o dejaste para después."
      >
        <div className="space-y-4">
          {reviewedSuggestions.length === 0 ? (
            <EmptyState text="Todavía no has revisado sugerencias clínicas." />
          ) : (
            reviewedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                actions={
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                    {suggestion.status === 'accepted'
                      ? 'Aceptada'
                      : suggestion.status === 'dismissed'
                        ? 'Descartada'
                        : 'Pospuesta'}
                  </span>
                }
              />
            ))
          )}
        </div>
      </Section>
    </div>
  );
}
