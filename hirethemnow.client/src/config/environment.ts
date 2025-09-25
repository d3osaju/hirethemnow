export interface EnvironmentConfig {
  apiUrl: string;
  appName: string;
  environment: 'development' | 'production';
  enableDebug: boolean;
  enableMockData: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development';

  return {
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7154/api',
    appName: import.meta.env.VITE_APP_NAME || 'HireThemNow',
    environment: env as EnvironmentConfig['environment'],
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as EnvironmentConfig['logLevel']) || 'info',
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