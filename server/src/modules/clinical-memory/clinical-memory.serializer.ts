import { ClinicalMemory } from '../../entities/ClinicalMemory.js';
import type { ClinicalMemoryDto } from '../../../../shared/contracts/http.js';

export function serializeClinicalMemory(memory: ClinicalMemory | null): ClinicalMemoryDto {
  if (!memory) {
    return {
      activeConditions: [],
      historicalConditions: [],
      activeMedications: [],
      importantFindings: [],
      pendingStudies: [],
      followUpRecommendations: [],
    };
  }

  return {
    id: memory.id,
    activeConditions: memory.activeConditions,
    historicalConditions: memory.historicalConditions,
    activeMedications: memory.activeMedications,
    importantFindings: memory.importantFindings,
    pendingStudies: memory.pendingStudies,
    followUpRecommendations: memory.followUpRecommendations,
    lastUpdatedAt: memory.lastUpdatedAt.toISOString(),
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}
