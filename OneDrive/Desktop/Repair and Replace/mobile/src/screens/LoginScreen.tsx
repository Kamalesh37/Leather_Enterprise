import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiConfig } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('mechanic@leathermfg.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(ApiConfig.getBaseUrl());
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password');
      return;
    }
    setErrorMessage('');
    try {
      await login({ email: email.trim(), password: password.trim() });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials or server URL.');
    }
  };

  const handleDemoLogin = async (role: 'mechanic' | 'tech_lead') => {
    setErrorMessage('');
    try {
      await switchRole(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed. Check server connection.');
    }
  };

  const handleSaveServerUrl = async () => {
    try {
      await ApiConfig.setBaseUrl(serverUrl);
      Alert.alert('Saved', 'Server API URL updated to: ' + ApiConfig.getBaseUrl());
      setShowServerConfig(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Ionicons name="construct" size={32} color={colors.primaryLight} />
          </View>
          <Text style={styles.brandTitle}>ENTERPRISE REPAIR & REPLACE</Text>
          <Text style={styles.brandSubtitle}>Mechanic & Field Engineer Portal</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In to Workshop</Text>

          {errorMessage.length > 0 && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.critical} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="mechanic@leathermfg.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Access Portal</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR 1-TAP DEMO LOGIN</Text>
            <View style={styles.divider} />
          </View>

          {/* 1-Tap Demo Shortcuts */}
          <TouchableOpacity
            style={styles.demoButtonMechanic}
            onPress={() => handleDemoLogin('mechanic')}
            disabled={isLoading}
          >
            <View style={styles.demoIcon}>
              <Ionicons name="build-outline" size={18} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Mateo Rodriguez</Text>
              <Text style={styles.demoRole}>Role: Maintenance Mechanic</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primaryLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButtonEngineer}
            onPress={() => handleDemoLogin('tech_lead')}
            disabled={isLoading}
          >
            <View style={styles.demoIconEngineer}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#818cf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Dr. Henrik Lindqvist</Text>
              <Text style={styles.demoRole}>Role: Tech Lead / Engineer</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* Server Config Toggle */}
        <TouchableOpacity
          style={styles.serverToggle}
          onPress={() => setShowServerConfig(!showServerConfig)}
        >
          <Ionicons name="settings-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.serverToggleText}>
            Backend Server: {ApiConfig.getBaseUrl()}
          </Text>
        </TouchableOpacity>

        {showServerConfig && (
          <View style={styles.serverConfigCard}>
            <Text style={styles.serverCardTitle}>Configure Backend API Host</Text>
            <Text style={styles.serverCardDesc}>
              When using a physical phone on local Wi-Fi, change localhost to your computer's LAN IP
              (e.g. http://192.168.1.50:8000/api)
            </Text>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              placeholder="http://192.168.1.x:8000/api"
              placeholderTextColor={colors.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={styles.saveServerBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.saveServerBtnText}>Apply API URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetServerBtn}
                onPress={async () => {
                  await ApiConfig.resetBaseUrl();
                  setServerUrl(ApiConfig.getBaseUrl());
                  Alert.alert('Reset', 'Restored default API URL');
                }}
              >
                <Text style={styles.resetServerBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textMain,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.primaryLight,
    marginTop: 3,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.criticalBg,
    borderColor: colors.criticalBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: colors.critical,
    fontSize: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: colors.textMain,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  demoButtonMechanic: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  demoButtonEngineer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  demoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoIconEngineer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  demoRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  serverToggleText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  serverConfigCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  serverCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  serverCardDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginVertical: 4,
    lineHeight: 15,
  },
  serverInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textMain,
    fontSize: 12,
    paddingHorizontal: 10,
    height: 36,
  },
  saveServerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveServerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resetServerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetServerBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
