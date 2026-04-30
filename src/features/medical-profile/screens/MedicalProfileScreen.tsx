import { MedicalProfile } from '../components/MedicalProfile';
import { ClinicalMemoryPanel } from '../components/ClinicalMemoryPanel';
import { ClinicalSuggestionsPanel } from '../components/ClinicalSuggestionsPanel';
import type {
  ClinicalMemory,
  ClinicalSuggestion,
  ClinicalSuggestionStatus,
  MedicalProfile as MedicalProfileData,
} from '../../../shared/api/api';

interface MedicalProfileScreenProps {
  profile: MedicalProfileData;
  clinicalMemory: ClinicalMemory;
  clinicalSuggestions: ClinicalSuggestion[];
  onUpdate: (profile: MedicalProfileData) => void | Promise<unknown>;
  onScheduleSuggestion: (suggestion: ClinicalSuggestion) => void | Promise<unknown>;
  onSuggestionStatusChange: (
    id: string,
    status: ClinicalSuggestionStatus
  ) => void | Promise<unknown>;
}

export function MedicalProfileScreen({
  profile,
  clinicalMemory,
  clinicalSuggestions,
  onUpdate,
  onScheduleSuggestion,
  onSuggestionStatusChange,
}: MedicalProfileScreenProps) {
  return (
    <div className="space-y-6">
      <ClinicalMemoryPanel memory={clinicalMemory} />
      <ClinicalSuggestionsPanel
        suggestions={clinicalSuggestions}
        onScheduleSuggestion={onScheduleSuggestion}
        onStatusChange={onSuggestionStatusChange}
      />
      <MedicalProfile profile={profile} onUpdate={onUpdate} />
    </div>
  );
}
