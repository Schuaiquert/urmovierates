import logger from '../utils/logger';

export const API_KEY_HEADER = 'X-API-Key';
export const MIN_API_KEY_LENGTH = 16;

export class ApiKeyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyConfigError';
  }
}

function loadAndValidateApiKey(): string {
  const raw = process.env.API_KEY;

  if (!raw || raw.trim().length === 0) {
    throw new ApiKeyConfigError(
      'API_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your .env file.'
    );
  }

  const key = raw.trim();

  if (key.length < MIN_API_KEY_LENGTH) {
    throw new ApiKeyConfigError(
      `API_KEY is too short (${key.length} chars). Minimum is ${MIN_API_KEY_LENGTH}.`
    );
  }

  // Reject placeholder / obvious-default values to prevent accidental deploy.
  const forbidden = ['changeme', 'your-api-key', 'example', 'placeholder', 'todo'];
  if (forbidden.some((needle) => key.toLowerCase().includes(needle))) {
    throw new ApiKeyConfigError(
      'API_KEY looks like a placeholder. Replace it with a real secret (openssl rand -hex 32).'
    );
  }

  return key;
}

// Loaded eagerly at module import — fail-fast at process start.
export const API_KEY: string = (() => {
  try {
    return loadAndValidateApiKey();
  } catch (err) {
    if (err instanceof ApiKeyConfigError) {
      logger.error(`❌ ${err.message}`);
      // Print to stderr as well so it shows up in Docker `docker logs`.
      // eslint-disable-next-line no-console
      console.error(`[FATAL] ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
})();
