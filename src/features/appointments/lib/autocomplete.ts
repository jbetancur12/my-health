const accentInsensitiveCollator = new Intl.Collator('es', {
  sensitivity: 'base',
  usage: 'sort',
});

export function sanitizeAutocompleteValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeAutocompleteValue(value: string) {
  return sanitizeAutocompleteValue(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');
}

export function canonicalizeAutocompleteValue(value: string, options: string[]) {
  const sanitizedValue = sanitizeAutocompleteValue(value);
  if (!sanitizedValue) {
    return '';
  }

  const normalizedValue = normalizeAutocompleteValue(sanitizedValue);
  const match = options.find((option) => normalizeAutocompleteValue(option) === normalizedValue);
  return match ?? sanitizedValue;
}

export function buildAutocompleteOptions(values: string[]) {
  const optionsByKey = new Map<string, string>();

  values.forEach((value) => {
    const sanitizedValue = sanitizeAutocompleteValue(value);
    if (!sanitizedValue) {
      return;
    }

    const normalizedValue = normalizeAutocompleteValue(sanitizedValue);
    if (!optionsByKey.has(normalizedValue)) {
      optionsByKey.set(normalizedValue, sanitizedValue);
    }
  });

  return Array.from(optionsByKey.values()).sort((left, right) =>
    accentInsensitiveCollator.compare(left, right)
  );
}
