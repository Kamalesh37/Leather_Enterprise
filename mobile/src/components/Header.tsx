import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();

  const isMechanic = user?.role === 'mechanic';
  const roleLabel = isMechanic
    ? 'MECHANIC'
    : user?.role === 'tech_lead'
    ? 'TECH LEAD'
    : (user?.role || 'CREW').toUpperCase();
  const roleColor = isMechanic ? colors.mechanicBadge : colors.techLeadBadge;

  const styles = getStyles(colors);

  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textMain} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoIcon}>
            <Ionicons name="construct" size={20} color={colors.primaryLight} />
          </View>
        )}

        <TouchableOpacity
          style={styles.titleContainer}
          activeOpacity={onOpenSettings ? 0.7 : 1}
          onPress={onOpenSettings}
          disabled={!onOpenSettings}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title || 'REPAIR & REPLACE'}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <View style={styles.userRow}>
              <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
              {user?.name && <Text style={styles.userName}>• {user.name.split(' ')[0]}</Text>}
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.rightActions}>
        {onOpenSettings ? (
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={logout}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    logoIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textMain,
      letterSpacing: 0.3,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    roleDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      marginRight: 6,
    },
    roleText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    userName: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 6,
    },
  });
