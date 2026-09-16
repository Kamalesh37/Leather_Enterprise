import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileApi } from '../api/client';
import { Machine, RepairLog } from '../api/types';
import { Header } from '../components/Header';
import { QRScannerModal } from '../components/QRScannerModal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

interface DashboardScreenProps {
  onOpenTicket: (ticketId: number) => void;
  onOpenMachine: (machineId: number) => void;
  onOpenSparesCatalog: () => void;
  onQRScanned: (qrHash: string) => void;
  onOpenSettings?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenTicket,
  onOpenMachine,
  onOpenSparesCatalog,
  onQRScanned,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [tickets, setTickets] = useState<RepairLog[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [ticketsRes, machinesRes] = await Promise.all([
        MobileApi.getTickets(),
        MobileApi.getMachines(),
      ]);

      if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
        setTickets(ticketsRes.data);
      }
      if (machinesRes.success && Array.isArray(machinesRes.data)) {
        setMachines(machinesRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // KPIs
  const openBreakdowns = tickets.filter(
    (t) => !['OPERATIONAL', 'CLOSED'].includes(t.status)
  );
  const myAssignedTickets = tickets.filter(
    (t) => t.mechanic_id === user?.id && !['OPERATIONAL', 'CLOSED'].includes(t.status)
  );
  const criticalTickets = openBreakdowns.filter((t) => t.priority === 'CRITICAL');
  const awaitingPartsTickets = openBreakdowns.filter(
    (t) => t.status === 'PENDING_TECH_APPROVAL' || t.status === 'PENDING_SPARE_DISPATCH'
  );

  return (
    <View style={styles.container}>
      <Header onOpenSettings={onOpenSettings} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryLight}
          />
        }
      >
        {/* Top Hero / Scanner Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.greetingCol}>
              <Text style={styles.heroGreeting}>
                Hello, {user?.name ? user.name.split(' ')[0] : 'Mechanic'}
              </Text>
              <Text style={styles.heroDesc}>
                Factory Floor Maintenance & Diagnostic Hub
              </Text>
            </View>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>LIVE</Text>
            </View>
          </View>

          {/* Prominent QR Scanner Button */}
          <TouchableOpacity
            style={styles.bigScanBtn}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.bigScanIconCircle}>
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </View>
            <View style={styles.bigScanTextCol}>
              <Text style={styles.bigScanBtnTitle}>SCAN MACHINE QR</Text>
              <Text style={styles.bigScanBtnSub}>Scan passport to attend breakdown or update space</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Quick KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>MY QUEUE</Text>
              <Ionicons name="construct-outline" size={16} color={colors.primaryLight} />
            </View>
            <Text style={[styles.kpiVal, { color: colors.primaryLight }]}>
              {myAssignedTickets.length}
            </Text>
            <Text style={styles.kpiSub}>Assigned to me</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardCritical]}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>BREAKDOWNS</Text>
              <Ionicons name="alert-circle-outline" size={16} color={colors.critical} />
            </View>
            <Text style={[styles.kpiVal, { color: colors.critical }]}>
              {openBreakdowns.length}
            </Text>
            <Text style={styles.kpiSub}>{criticalTickets.length} Critical</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardWarning]}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>SPARES</Text>
              <Ionicons name="cube-outline" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.kpiVal, { color: colors.warning }]}>
              {awaitingPartsTickets.length}
            </Text>
            <Text style={styles.kpiSub}>Awaiting BOM</Text>
          </View>
        </View>

        {/* Navigation Quick Links */}
        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={onOpenSparesCatalog}
          activeOpacity={0.8}
        >
          <View style={styles.quickNavLeft}>
            <View style={styles.quickNavIconBg}>
              <Ionicons name="cube" size={18} color={colors.secondaryLight} />
            </View>
            <View>
              <Text style={styles.quickNavTitle}>Warehouse Spares Catalog</Text>
              <Text style={styles.quickNavSub}>Check parts stock, bins, and compatible models</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.secondaryLight} />
        </TouchableOpacity>

        {/* Active Breakdown Tickets Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flash" size={18} color={colors.critical} />
            <Text style={styles.sectionTitle}>ACTIVE BREAKDOWNS TO ATTEND</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{openBreakdowns.length}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primaryLight} />
            <Text style={styles.loadingText}>Fetching floor tickets...</Text>
          </View>
        ) : openBreakdowns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
            <Text style={styles.emptyTitle}>All Factory Machinery Operational</Text>
            <Text style={styles.emptySubtitle}>No open breakdown tickets pending attendance.</Text>
          </View>
        ) : (
          openBreakdowns.map((ticket) => {
            const mch = ticket.machine;
            const spaceText = [
              mch?.block?.code || mch?.block?.name,
              mch?.floor?.name ? `Floor ${mch.floor.floor_number || ''}` : null,
              mch?.line?.name || mch?.line?.line_code,
            ]
              .filter(Boolean)
              .join(' › ');

            return (
              <View key={ticket.id} style={styles.ticketCard}>
                {/* Header info */}
                <View style={styles.ticketCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
                    <Text style={styles.machineName}>{mch?.name || 'Machinery'}</Text>
                  </View>
                  <View style={styles.statusCol}>
                    <StatusBadge status={ticket.priority} type="priority" />
                    <StatusBadge status={ticket.status} type="ticket" />
                  </View>
                </View>

                {/* Space / Location badge */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color={colors.primaryLight} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {spaceText || 'Factory Floor Location'}
                  </Text>
                  <Text style={styles.machineCodeTag}>[{mch?.machine_code}]</Text>
                </View>

                {/* Reported issue summary */}
                <Text style={styles.issueText} numberOfLines={2}>
                  {ticket.reported_issue}
                </Text>

                {/* Actions row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => mch?.id && onOpenMachine(mch.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="business-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.detailsBtnText}>Machine Space</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attendBtn}
                    onPress={() => onOpenTicket(ticket.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="construct" size={15} color="#fff" />
                    <Text style={styles.attendBtnText}>Attend Problem</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Machinery Directory Quick List */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="hardware-chip-outline" size={18} color={colors.primaryLight} />
            <Text style={styles.sectionTitle}>FACTORY MACHINERY DIRECTORY</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{machines.length}</Text>
          </View>
        </View>

        <View style={styles.machineGrid}>
          {machines.slice(0, 6).map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.machineCard}
              onPress={() => onOpenMachine(m.id)}
              activeOpacity={0.75}
            >
              <View style={styles.machineCardHeader}>
                <Text style={styles.machineCode}>{m.machine_code}</Text>
                <StatusBadge status={m.status} type="machine" />
              </View>
              <Text style={styles.machineTitle} numberOfLines={1}>
                {m.name}
              </Text>
              <View style={styles.machineSpaceRow}>
                <Ionicons name="compass-outline" size={13} color={colors.textMuted} />
                <Text style={styles.machineSpaceText} numberOfLines={1}>
                  {m.line?.name || m.floor?.name || 'Line Space'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Scanner Action Button */}
      <TouchableOpacity
        style={styles.fabScan}
        onPress={() => setScannerVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="scan" size={26} color="#fff" />
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={(qrHash) => {
          setScannerVisible(false);
          onQRScanned(qrHash);
        }}
      />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroBanner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  greetingCol: {
    flex: 1,
    marginRight: 8,
  },
  heroGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMain,
    letterSpacing: 0.2,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  bigScanBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  bigScanIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigScanTextCol: {
    flex: 1,
  },
  bigScanBtnTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bigScanBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
  },
  kpiCardPrimary: {
    borderTopWidth: 3,
    borderTopColor: colors.primaryLight,
  },
  kpiCardCritical: {
    borderTopWidth: 3,
    borderTopColor: colors.critical,
  },
  kpiCardWarning: {
    borderTopWidth: 3,
    borderTopColor: colors.warning,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickNavBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickNavIconBg: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavTitle: {
    color: colors.textMain,
    fontSize: 13,
    fontWeight: '700',
  },
  quickNavSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    letterSpacing: 0.6,
  },
  badgeCount: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  loadingBox: {
    padding: 36,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ticketNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    letterSpacing: 0.3,
  },
  machineName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 10,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  machineCodeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  issueText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 11,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    gap: 6,
  },
  detailsBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  attendBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    gap: 6,
  },
  attendBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  machineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  machineCard: {
    width: '48.6%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 11,
  },
  machineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  machineCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  machineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 4,
  },
  machineSpaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  machineSpaceText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  fabScan: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
});
