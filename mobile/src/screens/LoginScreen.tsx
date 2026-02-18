/**
 * Login Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore, colors } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    
    const success = await login(username, password);
    if (success) {
      navigation.navigate('Main' as never);
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigation.navigate('Main' as never);
    }
  };

  const styles = createStyles(themeColors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>CHARTWISE</Text>
          <Text style={styles.subtitle}>Trade Manager</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Icon name="user" size={16} color={themeColors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor={themeColors.textMuted}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={16} color={themeColors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={themeColors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? 'eye-slash' : 'eye'} size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <Icon name="arrow-right" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Icon name="google" size={18} color="#fff" brand />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerLink}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (themeColors: typeof colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.bgPrimary,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: themeColors.textPrimary,
      letterSpacing: 2,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    formContainer: {
      width: '100%',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      color: '#ef4444',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 52,
      color: themeColors.textPrimary,
      fontSize: 15,
    },
    eyeIcon: {
      padding: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
    },
    forgotText: {
      fontSize: 13,
      color: themeColors.primary,
    },
    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 13,
      color: themeColors.textMuted,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      height: 52,
      backgroundColor: '#4285F4',
      borderRadius: 12,
    },
    googleButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    registerButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    registerText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    registerLink: {
      color: themeColors.primary,
      fontWeight: '600',
    },
  });

export default LoginScreen;
