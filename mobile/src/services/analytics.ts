/**
 * Analytics Service
 * Handles data collection for user behavior and app usage
 */

import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

interface UserProperties {
  [key: string]: string | null;
}

class AnalyticsService {
  private isInitialized = false;
  private userId: string | null = null;
  private sessionStartTime: number = Date.now();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set default analytics properties
      await analytics().setAnalyticsCollectionEnabled(true);
      
      // Set user properties
      const appVersion = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();
      const brand = await DeviceInfo.getBrand();
      const model = await DeviceInfo.getModel();
      const systemVersion = DeviceInfo.getSystemVersion();

      await this.setUserProperties({
        app_version: appVersion,
        build_number: buildNumber,
        device_brand: brand,
        device_model: model,
        os_version: systemVersion,
        platform: Platform.OS,
      });

      this.isInitialized = true;
      
      // Track app open
      this.trackEvent('app_open', {
        platform: Platform.OS,
        version: appVersion,
      });

      console.log('[Analytics] Initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
    analytics().setUserId(userId);
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      await analytics().setUserProperties(properties);
    } catch (error) {
      console.error('[Analytics] Set user properties failed:', error);
    }
  }

  async trackEvent(eventName: string, params?: EventParams): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[Analytics] Not initialized, event not tracked:', eventName);
      return;
    }

    try {
      // Add common parameters
      const enrichedParams = {
        ...params,
        timestamp: Date.now(),
        user_id: this.userId || 'anonymous',
      };

      await analytics().logEvent(eventName, enrichedParams);
      
      // Also log to console for debugging
      if (__DEV__) {
        console.log('[Analytics]', eventName, enrichedParams);
      }
    } catch (error) {
      console.error('[Analytics] Track event failed:', error);
    }
  }

  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('[Analytics] Screen view failed:', error);
    }
  }

  async trackLogin(method: string): Promise<void> {
    await this.trackEvent('login', { method });
  }

  async trackTradeAction(action: string, params?: EventParams): Promise<void> {
    await this.trackEvent(`trade_${action}`, params);
  }

  async trackFeatureUsage(feature: string, action: string): Promise<void> {
    await this.trackEvent('feature_usage', { feature, action });
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await this.trackEvent('app_error', {
      error_message: error.message,
      error_stack: error.stack || '',
      context: context || 'unknown',
    });
  }

  async trackPerformance(metric: string, value: number, unit?: string): Promise<void> {
    await this.trackEvent('performance_metric', {
      metric,
      value,
      unit: unit || 'ms',
    });
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  async endSession(): Promise<void> {
    const duration = this.getSessionDuration();
    await this.trackEvent('session_end', {
      duration_seconds: Math.floor(duration / 1000),
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Convenience function for tracking events
export const trackEvent = (eventName: string, params?: EventParams) => {
  return analyticsService.trackEvent(eventName, params);
};

// Initialize function
export const initializeAnalytics = () => {
  return analyticsService.initialize();
};
