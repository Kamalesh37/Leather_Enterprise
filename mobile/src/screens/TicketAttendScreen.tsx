import React, { useEffect, useMemo, useState } from 'react';
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
import { MobileApi } from '../api/client';
import { Part, RepairLog } from '../api/types';
import { Header } from '../components/Header';
import { SpaceEditorModal } from '../components/SpaceEditorModal';
import { SparePickerModal } from '../components/SparePickerModal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface TicketAttendScreenProps {
  ticketId: number;
  onBack: () => void;
  onMachineDetails: (machineId: number) => void;
}

export const TicketAttendScreen: React.FC<TicketAttendScreenProps> = ({
  ticketId,
  onBack,
  onMachineDetails,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [ticket, setTicket] = useState<RepairLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Diagnosis inputs
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [selectedSpares, setSelectedSpares] = useState<Array<{ part: Part; quantity: number }>>([]);
  const [showSparePicker, setShowSparePicker] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const res = await MobileApi.getTicketById(ticketId);
      if (res.success && res.data) {
        setTicket(res.data);
        if (res.data.diagnosis_notes) {
          setDiagnosisNotes(res.data.diagnosis_notes);
        }
        if (res.data.spareRequests && Array.isArray(res.data.spareRequests)) {
          const loadedSpares = res.data.spareRequests
            .filter((req) => req.part)
            .map((req) => ({
              part: req.part as Part,
              quantity: req.requested_quantity,
            }));
          setSelectedSpares(loadedSpares);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit diagnosis & BOM requisition
  const handleSubmitDiagnosis = async () => {
    if (!diagnosisNotes.trim()) {
      Alert.alert('Diagnosis Required', 'Please enter your diagnostic assessment notes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        diagnosis_notes: diagnosisNotes.trim(),
        spare_parts: selectedSpares.map((s) => ({
          part_id: s.part.id,
          quantity: s.quantity,
        })),
      };

      const res = await MobileApi.submitDiagnosis(ticketId, payload);
      if (res.success && res.data) {
        setTicket(res.data);
        Alert.alert(
          'Assessment Recorded',
          selectedSpares.length > 0
            ? 'Diagnostic notes & BOM spare parts requisition submitted to Tech Lead for approval.'
            : 'Diagnostic notes recorded. Repair moved to IN_REPAIR status.'
        );
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit diagnosis');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mechanic marks repair complete
  const handleCompleteRepair = async () => {
    Alert.alert(
      'Complete Repair Work?',
      'Confirm that all physical maintenance and part replacements are finished. This moves the machine to final Tech Lead verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Complete',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const res = await MobileApi.completeRepair(ticketId);
              if (res.success && res.data) {
                setTicket(res.data);
                Alert.alert(
                  'Work Completed',
                  'Repair marked complete. Awaiting Tech Lead / Engineer sign-off.'
                );
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Tech Lead / Engineer sign-off
  const handleSignOff = async () => {
    Alert.alert(
      'Certify Operational?',
      'As Tech Lead / Engineer, certify that the machine meets safety criteria. Machine status will be set to OPERATIONAL in the database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Certify & Sign Off',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const res = await MobileApi.signOffRepair(ticketId);
              if (res.success && res.data) {
                setTicket(res.data);
                Alert.alert(
                  'Machine Certified Operational',
                  `Ticket ${res.data.ticket_number} successfully signed off. Downtime recorded.`
                );
              }
            } catch (err: any) {
              Alert.alert('Sign-off Error', err.message);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="ATTENDING PROBLEM" showBack onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={styles.loadingText}>Loading breakdown ticket...</Text>
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.container}>
        <Header title="TICKET NOT FOUND" showBack onBack={onBack} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.critical} />
          <Text style={styles.notFoundTitle}>Ticket Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isTechLeadOrAdmin = user?.role === 'tech_lead' || user?.role === 'admin';
  const isPendingSignOff = ticket.status === 'PENDING_SIGN_OFF';
  const isOperational = ticket.status === 'OPERATIONAL' || ticket.status === 'CLOSED';
  const canComplete =
    ticket.status === 'IN_REPAIR' || ticket.status === 'PENDING_SPARE_DISPATCH';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header
        title={ticket.ticket_number}
        subtitle="Problem Attendance Workbench"
        showBack
        onBack={onBack}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ticket Header Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
              <Text style={styles.machineTitle}>{ticket.machine?.name || 'Factory Machinery'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <StatusBadge status={ticket.status} type="ticket" />
              <StatusBadge status={ticket.priority} type="priority" />
            </View>
          </View>

          {/* Machine & Space Quick Card */}
          <View style={styles.machineSpaceBox}>
            <View style={{ flex: 1 }}>
              <View style={styles.codeRow}>
                <Ionicons name="hardware-chip-outline" size={14} color={colors.primaryLight} />
                <Text style={styles.machineCodeText}>
                  {ticket.machine?.machine_code} • {ticket.machine?.model_number}
                </Text>
              </View>
              <View style={styles.spaceRow}>
                <Ionicons name="location-outline" size={14} color={colors.secondaryLight} />
                <Text style={styles.spaceText}>
                  {ticket.machine?.line?.name || 'Line'} (
                  {ticket.machine?.floor?.name || 'Floor'})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.spaceRelocateBtn}
              onPress={() => setShowSpaceModal(true)}
            >
              <Ionicons name="navigate-outline" size={14} color={colors.primaryLight} />
              <Text style={styles.spaceRelocateText}>Space</Text>
            </TouchableOpacity>
          </View>

          {/* Reported Issue Box */}
          <Text style={styles.issueHeader}>REPORTED ISSUE / BREAKDOWN</Text>
          <View style={styles.issueBox}>
            <Text style={styles.issueContent}>{ticket.reported_issue}</Text>
            <Text style={styles.issueMeta}>
              Reported by: {ticket.reporter?.name || 'Line Supervisor'} • Priority: {ticket.priority}
            </Text>
          </View>
        </View>

        {/* WORKFLOW STATUS STEPPER BANNER */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepTitle}>CURRENT WORKFLOW STAGE</Text>
          <View style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: colors.primary, borderColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
            <View style={styles.stepLine} />
            <View
              style={[
                styles.stepCircle,
                ticket.status !== 'REPORTED'
                  ? { backgroundColor: colors.primary, borderColor: colors.primaryLight }
                  : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={[
                styles.stepCircle,
                isPendingSignOff || isOperational
                  ? { backgroundColor: colors.primary, borderColor: colors.primaryLight }
                  : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Text style={styles.stepNum}>3</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={[
                styles.stepCircle,
                isOperational
                  ? { backgroundColor: colors.success, borderColor: colors.successBorder }
                  : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Text style={styles.stepNum}>4</Text>
            </View>
          </View>
          <View style={styles.stepLabelsRow}>
            <Text style={styles.stepLabel}>Reported</Text>
            <Text style={styles.stepLabel}>Diagnosing</Text>
            <Text style={styles.stepLabel}>In Repair</Text>
            <Text style={styles.stepLabel}>Operational</Text>
          </View>
        </View>

        {/* ATTEND: DIAGNOSTIC ASSESSMENT & NOTES */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="clipboard-outline" size={18} color={colors.primaryLight} />
            <Text style={styles.cardHeaderTitle}>MECHANIC DIAGNOSTIC ASSESSMENT</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Record root cause analysis, motor wear, pneumatic leak, electrical fault, etc..."
            placeholderTextColor={colors.textMuted}
            value={diagnosisNotes}
            onChangeText={setDiagnosisNotes}
            editable={!isOperational}
          />

          {/* SPARE PARTS REQUISITION (BOM) */}
          <View style={styles.sparesHeader}>
            <View>
              <Text style={styles.sparesTitle}>REPLACEMENT SPARES (BOM)</Text>
              <Text style={styles.sparesSubtitle}>
                {selectedSpares.length} part(s) configured for repair
              </Text>
            </View>

            {!isOperational && (
              <TouchableOpacity
                style={styles.addSparesBtn}
                onPress={() => setShowSparePicker(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addSparesBtnText}>Select Spares</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedSpares.length === 0 ? (
            <View style={styles.noSparesBox}>
              <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
              <Text style={styles.noSparesText}>
                No replacement parts requested. (Standard adjustment or lubrication)
              </Text>
            </View>
          ) : (
            <View style={styles.sparesList}>
              {selectedSpares.map((item, idx) => (
                <View key={idx} style={styles.spareItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spareItemName}>{item.part.name}</Text>
                    <Text style={styles.spareItemCode}>
                      {item.part.part_number} • Bin: {item.part.bin_location || 'Main'}
                    </Text>
                  </View>
                  <View style={styles.spareQtyBadge}>
                    <Text style={styles.spareQtyText}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Submit Assessment Button */}
          {!isOperational && (
            <TouchableOpacity
              style={[styles.submitDiagnosisBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmitDiagnosis}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.submitDiagnosisBtnText}>
                    Submit Assessment & BOM Request
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ACTION: COMPLETE REPAIR */}
        {canComplete && (
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.primaryLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Physical Repair Finished?</Text>
                <Text style={styles.actionCardSubtitle}>
                  Submit to Tech Lead for final verification sign-off.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleCompleteRepair}
              disabled={isSubmitting}
            >
              <Ionicons name="checkbox-outline" size={18} color="#fff" />
              <Text style={styles.completeBtnText}>MARK REPAIR AS COMPLETED</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ACTION: TECH LEAD SIGN-OFF (FOR ENGINEERS / TECH LEADS) */}
        {isPendingSignOff && isTechLeadOrAdmin && (
          <View style={styles.signOffCard}>
            <View style={styles.signOffHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#818cf8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.signOffTitle}>Tech Lead / Engineer Sign-Off</Text>
                <Text style={styles.signOffDesc}>
                  Perform inspection test run. Certifying will mark machine OPERATIONAL and restore production.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.signOffBtn}
              onPress={handleSignOff}
              disabled={isSubmitting}
            >
              <Ionicons name="ribbon-outline" size={18} color="#fff" />
              <Text style={styles.signOffBtnText}>SIGN-OFF & CERTIFY OPERATIONAL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OPERATIONAL BANNER */}
        {isOperational && (
          <View style={styles.closedCard}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.closedTitle}>Ticket Successfully Resolved</Text>
            <Text style={styles.closedDesc}>
              Total Downtime:{' '}
              <Text style={{ color: colors.textMain, fontWeight: '700' }}>
                {ticket.total_downtime_minutes || 0} minutes
              </Text>
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Spare Parts Picker Modal */}
      <SparePickerModal
        visible={showSparePicker}
        onClose={() => setShowSparePicker(false)}
        onConfirm={(parts) => setSelectedSpares(parts)}
        initialSelected={selectedSpares}
      />

      {/* Machine Space Editor Modal */}
      {ticket.machine && (
        <SpaceEditorModal
          visible={showSpaceModal}
          machine={ticket.machine}
          onClose={() => setShowSpaceModal(false)}
          onSaved={(updated) => {
            setTicket((prev) => (prev ? { ...prev, machine: updated } : prev));
          }}
        />
      )}
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  machineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 2,
  },
  machineSpaceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  machineCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  spaceText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  spaceRelocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  spaceRelocateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  issueHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  issueBox: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  issueContent: {
    fontSize: 13,
    color: colors.textMain,
    lineHeight: 19,
  },
  issueMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  stepperCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.textMain,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 14,
  },
  sparesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  sparesSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addSparesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  addSparesBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  noSparesBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  noSparesText: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  sparesList: {
    marginBottom: 14,
    gap: 6,
  },
  spareItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  spareItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  spareItemCode: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spareQtyBadge: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spareQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  submitDiagnosisBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDiagnosisBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: 16,
    marginBottom: 14,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  completeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  signOffCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 16,
    marginBottom: 14,
  },
  signOffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  signOffTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
  },
  signOffDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  signOffBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOffBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  closedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  closedDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
