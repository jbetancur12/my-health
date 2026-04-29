import type { EntityManager, EntityName, FilterQuery, FindOptions } from '@mikro-orm/core';

export async function findFirst<T extends object>(
  em: Pick<EntityManager, 'find'>,
  entity: EntityName<T>,
  orderBy: FindOptions<T>['orderBy']
) {
  const [record] = await em.find(entity, {} as FilterQuery<T>, { limit: 1, orderBy });
  return record ?? null;
}
