/**
 * Wraps a single Promise in Promise.allSettled and returns the first (and only) result.
 * Used for consistent error handling without try-catch.
 */
export const settle = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
