export type DeepPartial<T> = T extends readonly (infer U)[]
  ? readonly DeepPartial<U>[]
  : T extends Record<string, unknown>
    ? {
        [K in keyof T]?: DeepPartial<T[K]>;
      }
    : T;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValue(target: unknown, source: unknown): unknown {
  if (isPlainObject(target) && isPlainObject(source)) {
    const merged: Record<string, unknown> = { ...target };
    for (const [key, value] of Object.entries(source)) {
      merged[key] = key in merged ? mergeValue(merged[key], value) : value;
    }
    return merged;
  }
  return source;
}

export function mergeLocaleCatalog<T extends Record<string, unknown>>(
  ...catalogs: readonly DeepPartial<T>[]
): T {
  return catalogs.reduce((accumulator, catalog) => mergeValue(accumulator, catalog) as T, {} as T);
}
