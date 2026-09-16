import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MachineStatus, Priority, TicketStatus } from '../api/types';
import { useTheme } from '../context/ThemeContext';

interface StatusBadgeProps {
  status: TicketStatus | MachineStatus | Priority | string;
  type?: 'machine' | 'ticket' | 'priority';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'ticket' }) => {
  const { colors, isDark } = useTheme();

  let label = status.replace(/_/g, ' ');
  let bg = colors.surfaceElevated;
  let text = colors.textSecondary;
  let border = colors.border;

  if (type === 'machine') {
    switch (status) {
      case 'OPERATIONAL':
        bg = colors.successBg;
        text = colors.success;
        border = colors.successBorder;
        label = 'OPERATIONAL';
        break;
      case 'BREAKDOWN':
        bg = colors.criticalBg;
        text = colors.critical;
        border = colors.criticalBorder;
        label = 'BREAKDOWN';
        break;
      case 'UNDER_MAINTENANCE':
        bg = colors.warningBg;
        text = colors.warning;
        border = colors.warningBorder;
        label = 'MAINTENANCE';
        break;
      default:
        bg = colors.surfaceElevated;
        text = colors.textMuted;
    }
  } else if (type === 'priority') {
    switch (status) {
      case 'CRITICAL':
        bg = colors.criticalBg;
        text = colors.critical;
        border = colors.criticalBorder;
        break;
      case 'HIGH':
        bg = colors.warningBg;
        text = colors.warning;
        border = colors.warningBorder;
        break;
      case 'MEDIUM':
        bg = colors.infoBg;
        text = colors.info;
        border = colors.infoBorder;
        break;
      case 'LOW':
        bg = colors.surfaceElevated;
        text = colors.textSecondary;
        border = colors.border;
        break;
    }
  } else {
    // Ticket Status
    switch (status) {
      case 'REPORTED':
        bg = colors.criticalBg;
        text = colors.critical;
        border = colors.criticalBorder;
        break;
      case 'DIAGNOSING':
        bg = colors.warningBg;
        text = colors.warning;
        border = colors.warningBorder;
        label = 'DIAGNOSING';
        break;
      case 'PENDING_TECH_APPROVAL':
        bg = isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff';
        text = isDark ? '#818cf8' : '#4f46e5';
        border = isDark ? 'rgba(99, 102, 241, 0.35)' : '#c7d2fe';
        label = 'TECH APPROVAL';
        break;
      case 'PENDING_SPARE_DISPATCH':
        bg = isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed';
        text = isDark ? '#fb923c' : '#c2410c';
        border = isDark ? 'rgba(234, 88, 12, 0.35)' : '#fed7aa';
        label = 'AWAITING SPARES';
        break;
      case 'IN_REPAIR':
        bg = colors.infoBg;
        text = colors.info;
        border = colors.infoBorder;
        label = 'IN REPAIR';
        break;
      case 'PENDING_SIGN_OFF':
        bg = isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff';
        text = isDark ? '#c084fc' : '#7e22ce';
        border = isDark ? 'rgba(168, 85, 247, 0.35)' : '#e9d5ff';
        label = 'AWAITING SIGN-OFF';
        break;
      case 'OPERATIONAL':
      case 'CLOSED':
        bg = colors.successBg;
        text = colors.success;
        border = colors.successBorder;
        label = 'COMPLETED';
        break;
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
