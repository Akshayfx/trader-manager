/**
 * Crash Reporting Service
 * Handles crash reporting and error tracking
 */

import crashlytics from '@react-native-firebase/crashlytics';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

class CrashReportingService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Enable crashlytics collection
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // Set default attributes
      const appVersion = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();
      
      await crashlytics().setAttribute('app_version', appVersion);
      await crashlytics().setAttribute('build_number', buildNumber);
      await crashlytics().setAttribute('platform', Platform.OS);

      this.isInitialized = true;
      console.log('[CrashReporting] Initialized successfully');
    } catch (error) {
      console.error('[CrashReporting] Initialization failed:', error);
    }
  }

  setUserId(userId: string): void {
    crashlytics().setUserId(userId);
  }

  async setAttribute(key: string, value: string): Promise<void> {
    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('[CrashReporting] Set attribute failed:', error);
    }
  }

  recordError(error: Error, context?: string): void {
    try {
      // Add context as a custom key
      if (context) {
        crashlytics().setAttribute('error_context', context);
      }
      
      // Record the error
      crashlytics().recordError(error);
      
      console.log('[CrashReporting] Error recorded:', error.message);
    } catch (e) {
      console.error('[CrashReporting] Failed to record error:', e);
    }
  }

  log(message: string): void {
    crashlytics().log(message);
  }

  async crash(): Promise<void> {
    // Only for testing - crashes the app
    if (__DEV__) {
      crashlytics().crash();
    }
  }
}

// Export singleton instance
export const crashReportingService = new CrashReportingService();

// Initialize function
export const initializeCrashReporting = () => {
  return crashReportingService.initialize();
};
