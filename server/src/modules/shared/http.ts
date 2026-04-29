export function getRouteId(value: string | string[] | undefined) {
  return typeof value === 'string' && value.trim() ? value : null;
}
