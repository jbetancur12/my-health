import { TagDefinition } from '../../entities/TagDefinition.js';
import { getOrm } from '../../orm.js';
import { serializeTagDefinition } from './tag.serializer.js';
import type { TagDefinitionInput } from './tag.types.js';
import { createTagDefinitionEntity } from '../shared/entity-factories.js';

export async function listTags() {
  const orm = await getOrm();
  const em = orm.em.fork();
  const tags = await em.find(TagDefinition, {}, { orderBy: { createdAt: 'asc' } });

  return tags.map(serializeTagDefinition);
}

export async function createTag(input: TagDefinitionInput) {
  const orm = await getOrm();
  const em = orm.em.fork();
  const tag = createTagDefinitionEntity(input);

  em.persist(tag);
  await em.flush();

  return serializeTagDefinition(tag);
}
