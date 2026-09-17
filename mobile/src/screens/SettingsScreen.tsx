import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiConfig } from '../api/client';
import { Role } from '../api/types';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { user, logout, switchRole, refreshUser, isLoading } = useAuth();
  const { theme, isDark, colors, setTheme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const styles = getStyles(colors);

  const isMechanic = user?.role === 'mechanic';
  const roleLabel = isMechanic
    ? 'MECHANIC / TECHNICIAN'
    : user?.role === 'tech_lead'
    ? 'TECH LEAD / ENGINEER'
    : (user?.role || 'CREW').toUpperCase();
  const roleColor = isMechanic ? colors.mechanicBadge : colors.techLeadBadge;

  // Generate User Initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      Alert.alert('Profile Synced', 'User credentials and assignments refreshed.');
    } catch {
      Alert.alert('Error', 'Could not refresh profile information.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRoleSwitch = async (targetRole: Role) => {
    if (user?.role === targetRole) return;
    setSwitchingRole(true);
    try {
      await switchRole(targetRole);
    } catch (err: any) {
      Alert.alert('Switch Error', err.message || 'Could not switch roles.');
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Workshop System?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="SETTINGS & PROFILE"
        subtitle="User profile & preferences"
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE HEADER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { borderColor: roleColor }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>
                {getInitials(user?.name)}
              </Text>
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Workshop Operator'}
                </Text>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'operator@leathermfg.com'}
              </Text>
              <View style={[styles.rolePill, { backgroundColor: roleColor + '20', borderColor: roleColor + '60' }]}>
                <Ionicons
                  name={isMechanic ? 'build' : 'shield-checkmark'}
                  size={12}
                  color={roleColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.rolePillText, { color: roleColor }]}>{roleLabel}</Text>
              </View>
            </View>
          </View>

          {/* User Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>EMPLOYEE ID</Text>
              <Text style={styles.detailValue}>EMP-00{user?.id || 1}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>PHONE</Text>
              <Text style={styles.detailValue}>{user?.phone || '+91 98401 23456'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>LOCATION ZONE</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user?.block?.name || 'Tannery Main Block'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>FACILITY LINE</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user?.line?.name || 'Finishing Line #1'}
              </Text>
            </View>
          </View>
        </View>

        {/* THEME & APPEARANCE SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={colors.primaryLight}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitle}>APPEARANCE & THEME</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.primaryDark }}
              thumbColor={isDark ? colors.primaryLight : '#f1f5f9'}
            />
          </View>

          <Text style={styles.sectionDescription}>
            Toggle between high-contrast Dark Mode for workshop floors and clean Light Mode for daylight viewing.
          </Text>

          {/* DUAL THEME TOGGLE BUTTONS */}
          <View style={styles.themeToggleRow}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                isDark && styles.themeButtonActive,
                { borderColor: isDark ? colors.primaryLight : colors.border },
              ]}
              onPress={() => setTheme('dark')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="moon"
                size={22}
                color={isDark ? colors.primaryLight : colors.textMuted}
              />
              <Text
                style={[
                  styles.themeButtonText,
                  { color: isDark ? colors.primaryLight : colors.textMuted },
                ]}
              >
                Dark Mode
              </Text>
              {isDark && (
                <View style={styles.activeCheckPill}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primaryLight} />
                  <Text style={styles.activeCheckText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                !isDark && styles.themeButtonActive,
                { borderColor: !isDark ? colors.primary : colors.border },
              ]}
              onPress={() => setTheme('light')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="sunny"
                size={22}
                color={!isDark ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.themeButtonText,
                  { color: !isDark ? colors.primary : colors.textMuted },
                ]}
              >
                Light Mode
              </Text>
              {!isDark && (
                <View style={styles.activeCheckPill}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={[styles.activeCheckText, { color: colors.primary }]}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.themeInfoBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.themeInfoText}>
              {isDark
                ? 'Dark Mode: Reduces eye fatigue and preserves battery on industrial OLED devices.'
                : 'Light Mode: Provides maximum contrast and readability in high-ambient-light work bays.'}
            </Text>
          </View>
        </View>

        {/* WORKSHOP ROLE QUICK SWITCH */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={colors.secondaryLight}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitle}>WORKSHOP ROLE</Text>
            </View>
            {switchingRole && <ActivityIndicator size="small" color={colors.secondaryLight} />}
          </View>

          <Text style={styles.sectionDescription}>
            Switch your active profile to test technician diagnosis vs tech-lead approval flows.
          </Text>

          <View style={styles.roleButtonRow}>
            <TouchableOpacity
              style={[
                styles.roleBtn,
                isMechanic && styles.roleBtnActive,
                { borderColor: isMechanic ? colors.mechanicBadge : colors.border },
              ]}
              onPress={() => handleRoleSwitch('mechanic')}
              disabled={switchingRole}
              activeOpacity={0.7}
            >
              <Ionicons
                name="build-outline"
                size={18}
                color={isMechanic ? colors.mechanicBadge : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  { color: isMechanic ? colors.mechanicBadge : colors.textSecondary },
                ]}
              >
                Mechanic
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBtn,
                !isMechanic && styles.roleBtnActive,
                { borderColor: !isMechanic ? colors.techLeadBadge : colors.border },
              ]}
              onPress={() => handleRoleSwitch('tech_lead')}
              disabled={switchingRole}
              activeOpacity={0.7}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={!isMechanic ? colors.techLeadBadge : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  { color: !isMechanic ? colors.techLeadBadge : colors.textSecondary },
                ]}
              >
                Tech Lead
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SYSTEM & CONNECTIVITY */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="server-outline"
                size={20}
                color={colors.info}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitle}>SYSTEM & GATEWAY</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.connectedText, { color: colors.success }]}>ONLINE</Text>
            </View>
          </View>

          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>API Host:</Text>
            <Text style={styles.systemValue} numberOfLines={1}>
              {ApiConfig.getBaseUrl()}
            </Text>
          </View>

          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>App Version:</Text>
            <Text style={styles.systemValue}>v1.3.0 (Enterprise Mobile)</Text>
          </View>

          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>Platform:</Text>
            <Text style={styles.systemValue}>{Platform.OS.toUpperCase()} Native Core</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
            activeOpacity={0.8}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primaryLight} />
            ) : (
              <>
                <Ionicons name="sync-outline" size={18} color={colors.textMain} />
                <Text style={styles.refreshButtonText}>Sync User Profile</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.critical} />
            <Text style={styles.logoutButtonText}>Sign Out of System</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginRight: 14,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '800',
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    profileInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textMain,
      letterSpacing: 0.3,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: 6,
    },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    rolePillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 12,
    },
    detailItem: {
      width: '47%',
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMain,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textMain,
      letterSpacing: 0.5,
    },
    sectionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 14,
    },
    themeToggleRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    themeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 8,
    },
    themeButtonActive: {
      backgroundColor: colors.surfaceElevated,
    },
    themeButtonText: {
      fontSize: 13,
      fontWeight: '700',
    },
    activeCheckPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginLeft: 4,
    },
    activeCheckText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryLight,
    },
    themeInfoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      padding: 10,
    },
    themeInfoText: {
      fontSize: 11,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 16,
    },
    roleButtonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    roleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 12,
      gap: 8,
    },
    roleBtnActive: {
      backgroundColor: colors.surfaceElevated,
    },
    roleBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    connectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.successBorder,
      gap: 5,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    connectedText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    systemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    systemLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    systemValue: {
      fontSize: 12,
      color: colors.textMain,
      fontWeight: '700',
      maxWidth: '65%',
    },
    actionContainer: {
      gap: 10,
      marginTop: 4,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 13,
      gap: 8,
    },
    refreshButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMain,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.criticalBg,
      borderWidth: 1,
      borderColor: colors.criticalBorder,
      borderRadius: 12,
      paddingVertical: 13,
      gap: 8,
    },
    logoutButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.critical,
    },
  });
