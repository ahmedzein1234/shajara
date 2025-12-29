/**
 * Structured Logger
 * Provides consistent logging with correlation IDs and context
 * Designed for Cloudflare Workers environment
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  treeId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private defaultContext: LogContext;

  constructor(minLevel: LogLevel = 'info', defaultContext: LogContext = {}) {
    this.minLevel = minLevel;
    this.defaultContext = defaultContext;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.minLevel, {
      ...this.defaultContext,
      ...context,
    });
    return childLogger;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, context: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.defaultContext,
        ...context,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, context, error);

    // In Cloudflare Workers, console.log output goes to Workers Logs
    // Format as JSON for structured logging
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context: LogContext = {}): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.log('error', message, context, err);
  }

  /**
   * Log a request start
   */
  requestStart(request: Request, context: LogContext = {}): void {
    const url = new URL(request.url);
    this.info('Request started', {
      ...context,
      method: request.method,
      path: url.pathname,
      query: url.search,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log a request completion
   */
  requestEnd(request: Request, response: Response, duration: number, context: LogContext = {}): void {
    const url = new URL(request.url);
    const level = response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info';

    this.log(level, 'Request completed', {
      ...context,
      method: request.method,
      path: url.pathname,
      statusCode: response.status,
      duration,
    });
  }

  /**
   * Log a database query
   */
  dbQuery(query: string, duration: number, context: LogContext = {}): void {
    this.debug('Database query executed', {
      ...context,
      query: query.substring(0, 200), // Truncate long queries
      duration,
    });
  }

  /**
   * Log an API call to external service
   */
  apiCall(service: string, endpoint: string, duration: number, success: boolean, context: LogContext = {}): void {
    const level = success ? 'info' : 'error';
    this.log(level, `External API call: ${service}`, {
      ...context,
      service,
      endpoint,
      duration,
      success,
    });
  }

  /**
   * Log a security event
   */
  security(event: string, context: LogContext = {}): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      securityEvent: event,
    });
  }

  /**
   * Log an audit event
   */
  audit(action: string, resource: string, context: LogContext = {}): void {
    this.info(`Audit: ${action} on ${resource}`, {
      ...context,
      auditAction: action,
      auditResource: resource,
    });
  }
}

// Generate a unique correlation ID
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get correlation ID from request headers or generate new one
export function getCorrelationId(request: Request): string {
  return request.headers.get('x-correlation-id') || generateCorrelationId();
}

// Create a request-scoped logger
export function createRequestLogger(request: Request, env?: { ENVIRONMENT?: string; LOG_LEVEL?: string }): Logger {
  const correlationId = getCorrelationId(request);
  const url = new URL(request.url);

  const minLevel: LogLevel = (env?.LOG_LEVEL as LogLevel) || 'info';

  return new Logger(minLevel, {
    correlationId,
    path: url.pathname,
    method: request.method,
    environment: env?.ENVIRONMENT || 'unknown',
  });
}

// Default logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info',
  { environment: process.env.ENVIRONMENT || 'development' }
);

export default logger;
