import { TagDefinition } from '../../entities/TagDefinition.js';
import type { AppointmentTagDto } from '../../../../shared/contracts/http.js';

export function serializeTagDefinition(tag: TagDefinition): AppointmentTagDto {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  };
}
