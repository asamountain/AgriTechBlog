/**
 * Senior Engineering Utilities
 * 1. Fail-fast environment validation
 * 2. Exponential backoff for resilient API calls
 */

/**
 * Ensures all required environment variables are present on startup.
 * Senior practice: Crash early if the system isn't configured correctly.
 */
export function validateEnv(requiredKeys: string[]) {
  const missing = requiredKeys.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`CRITICAL CONFIG ERROR: Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Retries a function with exponential backoff.
 * Senior practice: Don't hammer a failing service; give it room to breathe.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    const delay = baseDelay * Math.pow(2, 3 - retries); // 1s, 2s, 4s...
    console.warn(`[RETRY] Attempt failed. Retrying in ${delay}ms... (${retries} retries left)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, baseDelay);
  }
}
