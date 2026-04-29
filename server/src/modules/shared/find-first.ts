export async function findFirst<T extends object>(
  em: { find: (entityName: any, where: object, options?: object) => Promise<T[]> },
  entity: any,
  orderBy: object,
) {
  const [record] = await em.find(entity, {}, { limit: 1, orderBy });
  return record ?? null;
}
