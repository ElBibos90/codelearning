// Error tracking utility (you might want to use Sentry or similar in production)

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  init() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError(error || message);
    };

    window.onunhandledrejection = (event) => {
      this.captureError(event.reason);
    };
  }

  captureError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      type: error.name || 'Error',
      url: window.location.href,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.errors.push(errorInfo);

    // Keep array size under control
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Tracked]', errorInfo);
    }

    // In production, you might want to send to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorInfo);
    }
  }

  async sendToErrorService(errorInfo) {
    try {
      const endpoint = process.env.REACT_APP_ERROR_TRACKING_ENDPOINT;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
      });
    } catch (error) {
      console.error('[Error Tracking Failed]', error);
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();
