// Analytics utility for tracking events

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track an event in Google Analytics
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    // Fallback: log to console in development
    console.log('Analytics Event:', eventName, eventParams);
  }
};

/**
 * Track a route search
 */
export const trackRouteSearch = (from: string, to: string) => {
  trackEvent('search_route', {
    event_category: 'Route',
    event_label: `${from} to ${to}`,
    from_airport: from,
    to_airport: to,
  });
};

/**
 * Track Kayak affiliate click
 */
export const trackKayakClick = (from: string, to: string) => {
  trackEvent('kayak_click', {
    event_category: 'Affiliate',
    event_label: `${from} to ${to}`,
    from_airport: from,
    to_airport: to,
  });
};

/**
 * Track page view with custom parameters
 */
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
    });
  }
};
