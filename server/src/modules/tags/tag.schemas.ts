import type { TagDefinitionInput } from './tag.types.js';
import { parseNonEmptyString, parseObject } from '../shared/validation.js';

export function parseTagInput(input: unknown): TagDefinitionInput {
  const record = parseObject(input, 'Invalid tag payload');

  return {
    name: parseNonEmptyString(record.name, 'Tag name is required'),
    color: parseNonEmptyString(record.color, 'Tag color is required'),
  };
}
