import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileApi } from '../api/client';
import { Block, Floor, Line, Machine } from '../api/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SpaceEditorModalProps {
  visible: boolean;
  machine: Machine | null;
  onClose: () => void;
  onSaved: (updatedMachine: Machine) => void;
}

export const SpaceEditorModal: React.FC<SpaceEditorModalProps> = ({
  visible,
  machine,
  onClose,
  onSaved,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Selected values
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('OPERATIONAL');

  useEffect(() => {
    if (visible && machine) {
      setSelectedBlockId(machine.block_id || null);
      setSelectedFloorId(machine.floor_id || null);
      setSelectedLineId(machine.line_id || null);
      setSelectedStatus(machine.status || 'OPERATIONAL');
      loadHierarchy();
    }
  }, [visible, machine]);

  const loadHierarchy = async () => {
    setIsLoadingOptions(true);
    try {
      const res = await MobileApi.getHierarchyOptions();
      if (res.success && res.data) {
        setBlocks(res.data.blocks || []);
        setFloors(res.data.floors || []);
        setLines(res.data.lines || []);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load factory hierarchy options: ' + err.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Filter floors by selected block
  const availableFloors = selectedBlockId
    ? floors.filter((f) => f.block_id === selectedBlockId)
    : floors;

  // Filter lines by selected floor
  const availableLines = selectedFloorId
    ? lines.filter((l) => l.floor_id === selectedFloorId)
    : lines;

  const handleSaveSpace = async () => {
    if (!machine) return;
    setIsSaving(true);
    try {
      const res = await MobileApi.updateMachineSpace(machine.id, {
        block_id: selectedBlockId,
        floor_id: selectedFloorId,
        line_id: selectedLineId,
        status: selectedStatus,
      });

      if (res.success && res.data) {
        Alert.alert(
          'Space Updated',
          `Machine ${machine.machine_code} factory space and location updated in database.`
        );
        onSaved(res.data);
        onClose();
      } else {
        Alert.alert('Update Failed', res.message || 'Unable to update space');
      }
    } catch (err: any) {
      Alert.alert('Database Error', err.message || 'Failed to update machine space');
    } finally {
      setIsSaving(false);
    }
  };

  if (!machine) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.titleRow}>
                <Ionicons name="location-outline" size={20} color={colors.primaryLight} />
                <Text style={styles.modalTitle}>UPDATE FACTORY SPACE</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                {machine.machine_code} • {machine.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          {isLoadingOptions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryLight} />
              <Text style={styles.loadingText}>Fetching factory space options from DB...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* 1. FACTORY BLOCK */}
              <Text style={styles.fieldLabel}>1. FACTORY COMPLEX / BLOCK</Text>
              <View style={styles.optionsWrap}>
                {blocks.map((block) => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <TouchableOpacity
                      key={block.id}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => {
                        setSelectedBlockId(block.id);
                        setSelectedFloorId(null);
                        setSelectedLineId(null);
                      }}
                    >
                      <View style={styles.radioRow}>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? colors.primaryLight : colors.textMuted}
                        />
                        <Text
                          style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}
                        >
                          {block.name}
                        </Text>
                      </View>
                      <Text style={styles.optionCode}>{block.code}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. FLOOR / LEVEL */}
              <Text style={styles.fieldLabel}>2. FLOOR / LEVEL</Text>
              <View style={styles.optionsWrap}>
                {availableFloors.length === 0 ? (
                  <Text style={styles.emptyPrompt}>Select a block first</Text>
                ) : (
                  availableFloors.map((floor) => {
                    const isSelected = selectedFloorId === floor.id;
                    return (
                      <TouchableOpacity
                        key={floor.id}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => {
                          setSelectedFloorId(floor.id);
                          setSelectedLineId(null);
                        }}
                      >
                        <View style={styles.radioRow}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isSelected ? colors.primaryLight : colors.textMuted}
                          />
                          <Text
                            style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}
                          >
                            {floor.name}
                          </Text>
                        </View>
                        <Text style={styles.optionCode}>Level {floor.floor_number}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* 3. PRODUCTION LINE */}
              <Text style={styles.fieldLabel}>3. PRODUCTION LINE (SPACE)</Text>
              <View style={styles.optionsWrap}>
                {availableLines.length === 0 ? (
                  <Text style={styles.emptyPrompt}>Select a floor first</Text>
                ) : (
                  availableLines.map((line) => {
                    const isSelected = selectedLineId === line.id;
                    return (
                      <TouchableOpacity
                        key={line.id}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => setSelectedLineId(line.id)}
                      >
                        <View style={styles.radioRow}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isSelected ? colors.primaryLight : colors.textMuted}
                          />
                          <Text
                            style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}
                          >
                            {line.name}
                          </Text>
                        </View>
                        <Text style={styles.optionCode}>{line.line_code}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* 4. STATUS (OPERATIONAL / MAINTENANCE) */}
              <Text style={styles.fieldLabel}>4. MACHINE STATUS IN THIS SPACE</Text>
              <View style={styles.statusRow}>
                {['OPERATIONAL', 'UNDER_MAINTENANCE', 'BREAKDOWN'].map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        isSelected && {
                          backgroundColor:
                            st === 'OPERATIONAL'
                              ? colors.successBg
                              : st === 'BREAKDOWN'
                              ? colors.criticalBg
                              : colors.warningBg,
                          borderColor:
                            st === 'OPERATIONAL'
                              ? colors.success
                              : st === 'BREAKDOWN'
                              ? colors.critical
                              : colors.warning,
                        },
                      ]}
                      onPress={() => setSelectedStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          isSelected && {
                            color:
                              st === 'OPERATIONAL'
                                ? colors.success
                                : st === 'BREAKDOWN'
                                ? colors.critical
                                : colors.warning,
                          },
                        ]}
                      >
                        {st.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer Action */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveSpace}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Update Space in DB</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  optionsWrap: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    color: colors.textMain,
    fontWeight: '600',
    flex: 1,
  },
  optionTitleSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  optionCode: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  emptyPrompt: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
});
