import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileApi } from '../api/client';
import { Machine, RepairLog, ServiceCatalogItem } from '../api/types';
import { Header } from '../components/Header';
import { SpaceEditorModal } from '../components/SpaceEditorModal';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface MachineDetailScreenProps {
  machineId?: number;
  qrHash?: string;
  onBack: () => void;
  onAttendTicket: (ticketId: number) => void;
}

export const MachineDetailScreen: React.FC<MachineDetailScreenProps> = ({
  machineId,
  qrHash,
  onBack,
  onAttendTicket,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<ServiceCatalogItem[]>([]);
  const [activeBreakdown, setActiveBreakdown] = useState<RepairLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpaceModal, setShowSpaceModal] = useState(false);

  useEffect(() => {
    loadMachineData();
  }, [machineId, qrHash]);

  const loadMachineData = async () => {
    setIsLoading(true);
    try {
      if (qrHash) {
        // Direct QR Code Scan lookup
        const res = await MobileApi.lookupMachineByQR(qrHash);
        if (res.success && res.data) {
          setMachine(res.data.machine);
          setSuggestedServices(res.data.suggested_services || []);
          setActiveBreakdown(res.data.active_breakdown || null);
        } else {
          Alert.alert('Scan Result', `No machine found for QR code: ${qrHash}`);
        }
      } else if (machineId) {
        // Direct ID lookup
        const res = await MobileApi.getMachineById(machineId);
        if (res.success && res.data) {
          setMachine(res.data);
          const active = res.data.repairLogs?.find(
            (log) => !['OPERATIONAL', 'CLOSED'].includes(log.status)
          );
          setActiveBreakdown(active || null);
        }
      }
    } catch (err: any) {
      Alert.alert('Machine Lookup Error', err.message || 'Failed to fetch machine details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpaceSaved = (updated: Machine) => {
    setMachine((prev) => (prev ? { ...prev, ...updated } : updated));
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="MACHINE TELEMETRY" showBack onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={styles.loadingText}>Fetching machine details & telemetry...</Text>
        </View>
      </View>
    );
  }

  if (!machine) {
    return (
      <View style={styles.container}>
        <Header title="MACHINE NOT FOUND" showBack onBack={onBack} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.critical} />
          <Text style={styles.notFoundTitle}>Machine Not Found</Text>
          <Text style={styles.notFoundDesc}>
            The requested machine code or QR passport could not be resolved in the database.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={machine.machine_code}
        subtitle={machine.name}
        showBack
        onBack={onBack}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Machine Identity Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.codePill}>
              <Ionicons name="barcode-outline" size={14} color={colors.primaryLight} />
              <Text style={styles.codePillText}>{machine.machine_code}</Text>
            </View>
            <StatusBadge status={machine.status} type="machine" />
          </View>

          <Text style={styles.machineName}>{machine.name}</Text>
          <Text style={styles.modelSerial}>
            Model: {machine.model_number} • SN: {machine.serial_number}
          </Text>

          {/* QR Hash Indicator */}
          <View style={styles.qrRow}>
            <Ionicons name="qr-code-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.qrHashText} numberOfLines={1}>
              QR Passport: {machine.qr_code_hash}
            </Text>
          </View>
        </View>

        {/* FACTORY SPACE / LOCATION CARD (CRITICAL USER REQUIREMENT) */}
        <View style={styles.spaceCard}>
          <View style={styles.spaceCardHeader}>
            <View style={styles.spaceTitleRow}>
              <Ionicons name="location" size={18} color={colors.primaryLight} />
              <Text style={styles.spaceSectionTitle}>FACTORY SPACE & LOCATION</Text>
            </View>
            <TouchableOpacity
              style={styles.changeSpaceBtn}
              onPress={() => setShowSpaceModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={13} color="#fff" />
              <Text style={styles.changeSpaceBtnText}>CHANGE SPACE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spaceGrid}>
            <View style={styles.spaceItem}>
              <Text style={styles.spaceLabel}>COMPLEX / BLOCK</Text>
              <Text style={styles.spaceValue} numberOfLines={1}>
                {machine.block?.name || 'Block Unassigned'}
              </Text>
              <Text style={styles.spaceSub}>{machine.block?.code || '—'}</Text>
            </View>

            <View style={styles.spaceItem}>
              <Text style={styles.spaceLabel}>FLOOR LEVEL</Text>
              <Text style={styles.spaceValue} numberOfLines={1}>
                {machine.floor?.name || 'Floor Unassigned'}
              </Text>
              <Text style={styles.spaceSub}>
                {machine.floor?.floor_number ? `Level ${machine.floor.floor_number}` : '—'}
              </Text>
            </View>

            <View style={[styles.spaceItem, { borderRightWidth: 0 }]}>
              <Text style={styles.spaceLabel}>PRODUCTION LINE</Text>
              <Text style={[styles.spaceValue, { color: colors.primaryLight }]} numberOfLines={1}>
                {machine.line?.name || 'Line Unassigned'}
              </Text>
              <Text style={styles.spaceSub}>{machine.line?.line_code || '—'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.fullUpdateSpaceBtn}
            onPress={() => setShowSpaceModal(true)}
          >
            <Ionicons name="sync-outline" size={16} color={colors.secondaryLight} />
            <Text style={styles.fullUpdateSpaceBtnText}>
              Relocate Machine / Update Space in DB
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE BREAKDOWN ALERT (IF ANY) */}
        {activeBreakdown ? (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownTop}>
              <View style={styles.breakdownBadge}>
                <Ionicons name="warning" size={16} color={colors.critical} />
                <Text style={styles.breakdownBadgeText}>ACTIVE BREAKDOWN IN PROGRESS</Text>
              </View>
              <StatusBadge status={activeBreakdown.priority} type="priority" />
            </View>

            <Text style={styles.breakdownTicketNum}>{activeBreakdown.ticket_number}</Text>
            <Text style={styles.breakdownIssue}>{activeBreakdown.reported_issue}</Text>

            <View style={styles.breakdownMetaRow}>
              <Text style={styles.breakdownStatusLabel}>
                Status: <Text style={{ color: colors.textMain }}>{activeBreakdown.status.replace(/_/g, ' ')}</Text>
              </Text>
              {activeBreakdown.mechanic && (
                <Text style={styles.breakdownStatusLabel}>
                  Mechanic: <Text style={{ color: colors.primaryLight }}>{activeBreakdown.mechanic.name}</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.attendHeroBtn}
              onPress={() => onAttendTicket(activeBreakdown.id)}
            >
              <Ionicons name="hammer" size={18} color="#fff" />
              <Text style={styles.attendHeroBtnText}>ATTEND BREAKDOWN WORKFLOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.operationalCard}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.success} />
            <Text style={styles.operationalText}>
              No active breakdown. Machine is certified operational.
            </Text>
          </View>
        )}

        {/* SPECIFICATIONS & VENDOR */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeaderTitle}>HARDWARE & VENDOR SPECS</Text>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Vendor / OEM</Text>
            <Text style={styles.specVal}>{machine.vendor?.name || 'OEM Factory Direct'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Installed Date</Text>
            <Text style={styles.specVal}>
              {machine.installed_at ? new Date(machine.installed_at).toLocaleDateString() : 'Active'}
            </Text>
          </View>

          {machine.specifications && Object.keys(machine.specifications).length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.specLabel, { marginBottom: 6 }]}>Custom Specifications</Text>
              {Object.entries(machine.specifications).map(([key, val]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specSubKey}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.specVal}>{String(val)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SUGGESTED SERVICE CATALOG TEMPLATES */}
        {suggestedServices.length > 0 && (
          <View style={[styles.detailsCard, { marginBottom: 36 }]}>
            <Text style={styles.cardHeaderTitle}>RECOMMENDED SERVICE PROCEDURES</Text>
            {suggestedServices.map((svc) => (
              <View key={svc.id} style={styles.serviceItem}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{svc.title}</Text>
                  <Text style={styles.serviceHours}>~{svc.estimated_hours}h</Text>
                </View>
                <Text style={styles.serviceDesc}>{svc.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SPACE / LOCATION EDITOR MODAL */}
      <SpaceEditorModal
        visible={showSpaceModal}
        machine={machine}
        onClose={() => setShowSpaceModal(false)}
        onSaved={handleSpaceSaved}
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
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 12,
  },
  notFoundDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  machineName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textMain,
  },
  modelSerial: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 12,
    gap: 6,
  },
  qrHashText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    fontFamily: 'monospace',
  },
  spaceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  spaceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spaceSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 0.5,
  },
  changeSpaceBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  changeSpaceBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spaceGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  spaceItem: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  spaceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  spaceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  spaceSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fullUpdateSpaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
  },
  fullUpdateSpaceBtnText: {
    color: colors.secondaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: colors.criticalBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  breakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.critical,
    letterSpacing: 0.5,
  },
  breakdownTicketNum: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 4,
  },
  breakdownIssue: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  breakdownMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownStatusLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  attendHeroBtn: {
    backgroundColor: colors.critical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  attendHeroBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  operationalCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  operationalText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  specSubKey: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMain,
  },
  serviceItem: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  serviceHours: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
