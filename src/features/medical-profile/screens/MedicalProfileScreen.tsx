import { MedicalProfile } from '../components/MedicalProfile';
import type { MedicalProfile as MedicalProfileData } from '../../../shared/api/api';

interface MedicalProfileScreenProps {
  profile: MedicalProfileData;
  onUpdate: (profile: MedicalProfileData) => void | Promise<unknown>;
}

export function MedicalProfileScreen({ profile, onUpdate }: MedicalProfileScreenProps) {
  return <MedicalProfile profile={profile} onUpdate={onUpdate} />;
}
