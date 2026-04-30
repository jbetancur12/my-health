import { MedicalProfile } from '../components/MedicalProfile';
import { ClinicalMemoryPanel } from '../components/ClinicalMemoryPanel';
import type { ClinicalMemory, MedicalProfile as MedicalProfileData } from '../../../shared/api/api';

interface MedicalProfileScreenProps {
  profile: MedicalProfileData;
  clinicalMemory: ClinicalMemory;
  onUpdate: (profile: MedicalProfileData) => void | Promise<unknown>;
}

export function MedicalProfileScreen({
  profile,
  clinicalMemory,
  onUpdate,
}: MedicalProfileScreenProps) {
  return (
    <div className="space-y-6">
      <ClinicalMemoryPanel memory={clinicalMemory} />
      <MedicalProfile profile={profile} onUpdate={onUpdate} />
    </div>
  );
}
