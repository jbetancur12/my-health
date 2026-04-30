import { Brain, ClipboardList, History, Pill, SearchCheck, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicalMemory } from '../../../shared/api/contracts';

interface ClinicalMemoryPanelProps {
  memory: ClinicalMemory;
}

function formatFactDate(date?: Date) {
  if (!date) {
    return undefined;
  }

  return format(date, "d 'de' MMM yyyy", { locale: es });
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm italic text-gray-400">{text}</p>;
}

export function ClinicalMemoryPanel({ memory }: ClinicalMemoryPanelProps) {
  const hasAnyContent =
    memory.activeConditions.length > 0 ||
    memory.historicalConditions.length > 0 ||
    memory.activeMedications.length > 0 ||
    memory.importantFindings.length > 0 ||
    memory.pendingStudies.length > 0 ||
    memory.followUpRecommendations.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-blue-950">
              <Brain className="h-6 w-6 text-blue-600" />
              Memoria Clínica General
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              Esta vista consolida hallazgos relevantes del historial documental sin depender solo
              de las últimas citas.
            </p>
          </div>
          {memory.lastUpdatedAt && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700">
              Actualizada {format(memory.lastUpdatedAt, "d/MM/yyyy h:mm a", { locale: es })}
            </span>
          )}
        </div>
      </div>

      {!hasAnyContent && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <EmptyState text="Todavía no hay memoria clínica consolidada. Cuando existan documentos resumidos con datos estructurados, aparecerán aquí." />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            Patologías activas
          </h4>
          <div className="space-y-3">
            {memory.activeConditions.length === 0 ? (
              <EmptyState text="No hay patologías activas consolidadas todavía." />
            ) : (
              memory.activeConditions.map((fact) => (
                <div key={`active-${fact.label}`} className="rounded-md border border-purple-100 bg-purple-50 p-3">
                  <p className="font-medium text-purple-950">{fact.label}</p>
                  {formatFactDate(fact.lastSeenAt) && (
                    <p className="mt-1 text-xs text-purple-700">
                      Última referencia: {formatFactDate(fact.lastSeenAt)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <History className="h-5 w-5 text-gray-600" />
            Patologías históricas
          </h4>
          <div className="space-y-3">
            {memory.historicalConditions.length === 0 ? (
              <EmptyState text="No hay patologías históricas diferenciadas todavía." />
            ) : (
              memory.historicalConditions.map((fact) => (
                <div key={`historical-${fact.label}`} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="font-medium text-gray-900">{fact.label}</p>
                  {formatFactDate(fact.lastSeenAt) && (
                    <p className="mt-1 text-xs text-gray-600">
                      Última referencia: {formatFactDate(fact.lastSeenAt)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Pill className="h-5 w-5 text-green-600" />
            Medicamentos activos
          </h4>
          <div className="space-y-3">
            {memory.activeMedications.length === 0 ? (
              <EmptyState text="Todavía no hay medicamentos activos consolidados." />
            ) : (
              memory.activeMedications.map((medication) => (
                <div key={`medication-${medication.label}`} className="rounded-md border border-green-100 bg-green-50 p-3">
                  <p className="font-medium text-green-950">{medication.label}</p>
                  <p className="mt-1 text-xs text-green-800">
                    {[medication.dosage, medication.frequency].filter(Boolean).join(' · ') || 'Sin dosis/frecuencia detectada'}
                  </p>
                  {medication.notes && (
                    <p className="mt-2 text-xs text-green-900">{medication.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <SearchCheck className="h-5 w-5 text-amber-600" />
            Estudios pendientes
          </h4>
          <div className="space-y-3">
            {memory.pendingStudies.length === 0 ? (
              <EmptyState text="No hay estudios pendientes consolidados." />
            ) : (
              memory.pendingStudies.map((fact) => (
                <div key={`study-${fact.label}`} className="rounded-md border border-amber-100 bg-amber-50 p-3">
                  <p className="font-medium text-amber-950">{fact.label}</p>
                  {formatFactDate(fact.lastSeenAt) && (
                    <p className="mt-1 text-xs text-amber-700">
                      Última referencia: {formatFactDate(fact.lastSeenAt)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Recomendaciones de control
          </h4>
          <div className="space-y-3">
            {memory.followUpRecommendations.length === 0 ? (
              <EmptyState text="No hay recomendaciones de control consolidadas." />
            ) : (
              memory.followUpRecommendations.map((followUp) => (
                <div key={`followup-${followUp.description}-${followUp.interval ?? ''}`} className="rounded-md border border-blue-100 bg-blue-50 p-3">
                  <p className="font-medium text-blue-950">{followUp.description}</p>
                  <p className="mt-1 text-xs text-blue-800">
                    {[followUp.interval, followUp.suggestedSpecialty]
                      .filter(Boolean)
                      .join(' · ') || 'Sin intervalo específico detectado'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Brain className="h-5 w-5 text-pink-600" />
            Hallazgos importantes
          </h4>
          <div className="space-y-3">
            {memory.importantFindings.length === 0 ? (
              <EmptyState text="No hay hallazgos importantes consolidados todavía." />
            ) : (
              memory.importantFindings.map((fact) => (
                <div key={`finding-${fact.label}`} className="rounded-md border border-pink-100 bg-pink-50 p-3">
                  <p className="font-medium text-pink-950">{fact.label}</p>
                  {formatFactDate(fact.lastSeenAt) && (
                    <p className="mt-1 text-xs text-pink-700">
                      Última referencia: {formatFactDate(fact.lastSeenAt)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
