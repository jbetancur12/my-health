import { UpcomingControls } from '../components/UpcomingControls';
import type { Control } from '../../../shared/api/api';
import { FeatureStatePanel } from '../../../shared/components/FeatureStatePanel';

interface ControlsScreenProps {
  controls: Control[];
  onControlClick: (control: Control) => void;
}

export function ControlsScreen({ controls, onControlClick }: ControlsScreenProps) {
  if (controls.length === 0) {
    return (
      <FeatureStatePanel
        variant="empty"
        title="No hay controles programados"
        message="Cuando registres controles asociados a una cita aparecerán aquí para que puedas hacer seguimiento."
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <UpcomingControls controls={controls} onControlClick={onControlClick} />
    </div>
  );
}
