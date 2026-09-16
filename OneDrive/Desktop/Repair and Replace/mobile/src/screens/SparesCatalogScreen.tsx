import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SparesCatalogScreenProps {
  onBack: () => void;
}

export const SparesCatalogScreen: React.FC<SparesCatalogScreenProps> = ({ onBack }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const res = await MobileApi.getParts();
      if (res.success && Array.isArray(res.data)) {
        setParts(res.data);
      }
    } catch (err) {
      console.error('Failed to load parts:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
      (p.bin_location && p.bin_location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Header title="SPARES CATALOG" subtitle="Warehouse Inventory" showBack onBack={onBack} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by part name, SKU, bin location..."
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

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadParts();
            }}
            tintColor={colors.primaryLight}
          />
        }
      >
        <View style={styles.headerInfoRow}>
          <Text style={styles.countText}>{filtered.length} Parts available</Text>
          <Text style={styles.syncText}>Live Warehouse DB</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primaryLight} />
            <Text style={styles.loadingText}>Fetching inventory...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No matching spare parts</Text>
          </View>
        ) : (
          filtered.map((p) => {
            const isCritical = p.current_stock <= (p.minimum_stock || 5);
            const isOutOfStock = p.current_stock === 0;

            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.partName}>{p.name}</Text>
                    <Text style={styles.partNumber}>{p.part_number}</Text>
                  </View>
                  <View
                    style={[
                      styles.stockPill,
                      {
                        backgroundColor: isOutOfStock
                          ? colors.criticalBg
                          : isCritical
                          ? colors.warningBg
                          : colors.successBg,
                        borderColor: isOutOfStock
                          ? colors.criticalBorder
                          : isCritical
                          ? colors.warningBorder
                          : colors.successBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockText,
                        {
                          color: isOutOfStock
                            ? colors.critical
                            : isCritical
                            ? colors.warning
                            : colors.success,
                        },
                      ]}
                    >
                      {p.current_stock} in stock
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="file-tray-full-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>Bin: {p.bin_location || 'General'}</Text>
                  </View>
                  {p.category && (
                    <View style={styles.metaItem}>
                      <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>{p.category}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>${Number(p.unit_cost).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textMain,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  syncText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  centered: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  partName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  partNumber: {
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
