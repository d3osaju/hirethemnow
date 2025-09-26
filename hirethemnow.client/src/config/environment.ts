export interface EnvironmentConfig {
  apiUrl: string;
  appName: string;
  environment: 'development' | 'production';
  enableDebug: boolean;
  enableMockData: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  googleClientId: string;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development';

  // Default URLs based on environment
  const getDefaultApiUrl = () => {
    // If running in Docker container (localhost:8080), use local backend
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '8080') {
      return 'http://localhost:8080/api';
    }

    // If in production but not Docker, use AWS Lambda
    if (env === 'production') {
      return 'https://e4ur4ddyoi.execute-api.us-east-1.amazonaws.com/prod';
    }

    // Default development server
    return 'http://localhost:5219/api';
  };

  return {
    apiUrl: import.meta.env.VITE_API_BASE_URL || getDefaultApiUrl(),
    appName: import.meta.env.VITE_APP_NAME || 'HireThemNow',
    environment: env as EnvironmentConfig['environment'],
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || env === 'development',
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as EnvironmentConfig['logLevel']) || (env === 'development' ? 'debug' : 'warn'),
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com',
  };
};

export const config = getEnvironmentConfig();

// Environment-specific features
export const isDevelopment = config.environment === 'development';
export const isProduction = config.environment === 'production';

// Logger utility
export const logger = {
  debug: (...args: unknown[]) => {
    if (config.logLevel === 'debug' && config.enableDebug) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (['debug', 'info'].includes(config.logLevel)) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (['debug', 'info', 'warn'].includes(config.logLevel)) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};