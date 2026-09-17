import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileApi } from '../api/client';
import { Part } from '../api/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SelectedPartItem {
  part: Part;
  quantity: number;
}

interface SparePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedParts: SelectedPartItem[]) => void;
  initialSelected?: SelectedPartItem[];
}

export const SparePickerModal: React.FC<SparePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialSelected = [],
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Map<number, SelectedPartItem>>(new Map());

  useEffect(() => {
    if (visible) {
      const map = new Map<number, SelectedPartItem>();
      initialSelected.forEach((item) => map.set(item.part.id, item));
      setSelections(map);
      fetchParts();
    }
  }, [visible]);

  const fetchParts = async () => {
    setIsLoading(true);
    try {
      const res = await MobileApi.getParts();
      if (res.success && Array.isArray(res.data)) {
        setParts(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch parts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePart = (part: Part) => {
    const next = new Map(selections);
    if (next.has(part.id)) {
      next.delete(part.id);
    } else {
      next.set(part.id, { part, quantity: 1 });
    }
    setSelections(next);
  };

  const handleUpdateQty = (partId: number, delta: number) => {
    const next = new Map(selections);
    const existing = next.get(partId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      next.delete(partId);
    } else {
      // Don't exceed stock if stock is known
      const capped = Math.min(newQty, Math.max(1, existing.part.current_stock));
      next.set(partId, { ...existing, quantity: capped });
    }
    setSelections(next);
  };

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDone = () => {
    onConfirm(Array.from(selections.values()));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Ionicons name="cube-outline" size={20} color={colors.primaryLight} />
                <Text style={styles.title}>SELECT REPLACEMENT SPARES</Text>
              </View>
              <Text style={styles.subtitle}>
                {selections.size} parts selected for Bill of Materials (BOM)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search spares by name, code or category..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primaryLight} />
              <Text style={styles.loadingText}>Fetching spare parts catalog...</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {filteredParts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No matching spare parts in catalog</Text>
                </View>
              ) : (
                filteredParts.map((part) => {
                  const isSelected = selections.has(part.id);
                  const selectedItem = selections.get(part.id);
                  const inStock = part.current_stock > 0;

                  return (
                    <View
                      key={part.id}
                      style={[styles.partCard, isSelected && styles.partCardSelected]}
                    >
                      <TouchableOpacity
                        style={styles.partInfo}
                        onPress={() => handleTogglePart(part)}
                      >
                        <View style={styles.partHeader}>
                          <Text
                            style={[styles.partName, isSelected && styles.partNameSelected]}
                            numberOfLines={1}
                          >
                            {part.name}
                          </Text>
                          <View
                            style={[
                              styles.stockBadge,
                              {
                                backgroundColor: inStock ? colors.successBg : colors.criticalBg,
                                borderColor: inStock ? colors.successBorder : colors.criticalBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stockText,
                                { color: inStock ? colors.success : colors.critical },
                              ]}
                            >
                              {inStock ? `${part.current_stock} in stock` : 'Out of stock'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <Text style={styles.partCode}>{part.part_number}</Text>
                          {part.bin_location && (
                            <Text style={styles.binLoc}>• Bin: {part.bin_location}</Text>
                          )}
                          {part.category && (
                            <Text style={styles.binLoc}>• {part.category}</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {isSelected && selectedItem && (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleUpdateQty(part.id, -1)}
                          >
                            <Ionicons name="remove" size={16} color={colors.textMain} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{selectedItem.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleUpdateQty(part.id, 1)}
                            disabled={selectedItem.quantity >= part.current_stock}
                          >
                            <Ionicons
                              name="add"
                              size={16}
                              color={
                                selectedItem.quantity >= part.current_stock
                                  ? colors.textDisabled
                                  : colors.textMain
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Footer Confirm */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleDone}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.confirmText}>Confirm ({selections.size}) Spares</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textMain,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 12,
    maxHeight: 400,
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
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  partCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partCardSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  partInfo: {
    flex: 1,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  partName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    flex: 1,
    marginRight: 6,
  },
  partNameSelected: {
    color: colors.primaryLight,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  partCode: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  binLoc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    color: colors.textMain,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
