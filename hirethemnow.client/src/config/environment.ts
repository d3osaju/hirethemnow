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
    // If running in production, use production API URL from environment
    if (env === 'production') {
      // Use the AWS Fargate load balancer URL from environment
      return import.meta.env.VITE_API_BASE_URL || 'http://hirethemnow-fargate-prod-alb-623046515.us-east-1.elb.amazonaws.com/api';
    }

    // For development, use local backend
    if (env === 'development') {
      return 'http://localhost:5219/api';
    }

    // Runtime detection for special cases
    if (typeof window !== 'undefined') {
      const { hostname, port } = window.location;

      // If running in Docker container
      if (hostname === 'localhost' && port === '8080') {
        return 'http://localhost:8080/api';
      }

      // If accessing via different port in development
      if (hostname === 'localhost' && ['5173', '5174', '3000'].includes(port)) {
        return 'http://localhost:5219/api';
      }

      // For production domains (CloudFront), use AWS Fargate API
      if (hostname.includes('cloudfront.net') || (hostname.includes('hirethemnow') && !hostname.includes('localhost'))) {
        return 'http://hirethemnow-fargate-prod-alb-623046515.us-east-1.elb.amazonaws.com/api';
      }
    }

    // Fallback to development
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

// Logger utility - disabled for production
export const logger = {
  debug: () => {
    // Logging disabled
  },
  info: () => {
    // Logging disabled
  },
  warn: () => {
    // Logging disabled
  },
  error: () => {
    // Logging disabled
  },
};