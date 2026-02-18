/**
 * Authentication Service
 */

import { Platform } from 'react-native';

const API_BASE_URL = 'http://localhost:3001/api'; // Update for production

export class AuthService {
  static async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(username, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  static async getUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  static async getSettings(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  }

  static async saveSettings(token, settings) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Save settings error:', error);
      throw error;
    }
  }

  static async validateLicense(token, licenseKey, hardwareId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey, hardwareId })
      });
      
      return await response.json();
    } catch (error) {
      console.error('License validation error:', error);
      throw error;
    }
  }
}
