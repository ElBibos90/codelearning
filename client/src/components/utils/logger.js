const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const getCurrentLogLevel = () => {
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
};

class Logger {
  constructor() {
    this.logLevel = getCurrentLogLevel();
  }

  setLogLevel(level) {
    this.logLevel = level;
  }

  formatMessage(level, message, extra = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
      environment: process.env.NODE_ENV
    };
  }

  debug(message, extra = {}) {
    if (this.logLevel <= LOG_LEVELS.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', message, extra);
      console.debug('[DEBUG]', formattedMessage);
    }
  }

  info(message, extra = {}) {
    if (this.logLevel <= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage('INFO', message, extra);
      console.info('[INFO]', formattedMessage);
    }
  }

  warn(message, extra = {}) {
    if (this.logLevel <= LOG_LEVELS.WARN) {
      const formattedMessage = this.formatMessage('WARN', message, extra);
      console.warn('[WARN]', formattedMessage);
    }
  }

  error(message, error = null, extra = {}) {
    if (this.logLevel <= LOG_LEVELS.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', message, {
        ...extra,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : null
      });
      console.error('[ERROR]', formattedMessage);
    }
  }
}

export const logger = new Logger();
