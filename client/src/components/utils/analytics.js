// Basic analytics implementation
// In production, you might want to use a service like Google Analytics or Plausible

const ANALYTICS_ENDPOINT = process.env.REACT_APP_ANALYTICS_ENDPOINT;

export const trackPageView = (path) => {
  try {
    const payload = {
      type: 'pageview',
      path,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Send to your analytics endpoint
    if (ANALYTICS_ENDPOINT) {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', payload);
    }
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
};

export const trackEvent = (category, action, label = null, value = null) => {
  try {
    const payload = {
      type: 'event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString()
    };

    if (ANALYTICS_ENDPOINT) {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', payload);
    }
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
};
