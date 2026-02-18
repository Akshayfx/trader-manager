/**
 * Push Notifications Service
 * Handles FCM push notifications for news alerts and trade notifications
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { trackEvent } from './analytics';

class PushNotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[PushNotifications] Authorization status:', authStatus);
        
        // Get FCM token
        const token = await messaging().getToken();
        console.log('[PushNotifications] FCM Token:', token);
        
        // Save token to backend
        await this.saveTokenToBackend(token);

        // Set up message handlers
        this.setupMessageHandlers();

        this.isInitialized = true;
        
        trackEvent('push_notifications_enabled', {
          platform: Platform.OS,
        });
      } else {
        console.log('[PushNotifications] Permission denied');
        trackEvent('push_notifications_denied');
      }
    } catch (error) {
      console.error('[PushNotifications] Initialization failed:', error);
    }
  }

  private setupMessageHandlers(): void {
    // Foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('[PushNotifications] Foreground message:', remoteMessage);
      
      // Handle different notification types
      const { data } = remoteMessage;
      if (data?.type === 'news_alert') {
        this.handleNewsAlert(data);
      } else if (data?.type === 'trade_alert') {
        this.handleTradeAlert(data);
      }
      
      trackEvent('push_notification_received', {
        type: data?.type || 'unknown',
        foreground: true,
      });
    });

    // Background/quit state messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[PushNotifications] Background message:', remoteMessage);
      
      trackEvent('push_notification_received', {
        type: remoteMessage.data?.type || 'unknown',
        foreground: false,
      });
    });

    // Token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('[PushNotifications] Token refreshed:', token);
      await this.saveTokenToBackend(token);
    });
  }

  private async saveTokenToBackend(token: string): Promise<void> {
    // TODO: Implement API call to save token
    console.log('[PushNotifications] Saving token to backend:', token);
  }

  private handleNewsAlert(data: any): void {
    // Show local notification or update UI
    console.log('[PushNotifications] News alert:', data);
  }

  private handleTradeAlert(data: any): void {
    // Show local notification or update UI
    console.log('[PushNotifications] Trade alert:', data);
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log('[PushNotifications] Subscribed to topic:', topic);
      trackEvent('push_topic_subscribed', { topic });
    } catch (error) {
      console.error('[PushNotifications] Subscribe failed:', error);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log('[PushNotifications] Unsubscribed from topic:', topic);
      trackEvent('push_topic_unsubscribed', { topic });
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Initialize function
export const initializePushNotifications = () => {
  return pushNotificationService.initialize();
};
