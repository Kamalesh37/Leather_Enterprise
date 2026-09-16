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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { MobileApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (qrHash: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ visible, onClose, onScanned }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [recentMachines, setRecentMachines] = useState<Array<{ code: string; name: string; qr: string }>>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsScanning(true);
      fetchRecentMachines();
    }
  }, [visible]);

  const fetchRecentMachines = async () => {
    setIsLoadingRecent(true);
    try {
      const res = await MobileApi.getMachines();
      if (res.success && Array.isArray(res.data)) {
        setRecentMachines(
          res.data.slice(0, 5).map((m) => ({
            code: m.machine_code,
            name: m.name,
            qr: m.qr_code_hash,
          }))
        );
      }
    } catch (e) {
      // fallback presets
      setRecentMachines([
        { code: 'MCH-STITCH-001', name: 'Durkopp Heavy Stitcher', qr: 'QR-STITCH-001' },
        { code: 'MCH-CUT-002', name: 'Atom CNC Leather Cutter', qr: 'QR-CUT-002' },
        { code: 'MCH-SKIVE-003', name: 'Camoga Leather Skiving', qr: 'QR-SKIVE-003' },
      ]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    onScanned(data);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setIsScanning(false);
    onScanned(manualCode.trim());
    setManualCode('');
  };

  const handleSelectQuickMachine = (qr: string) => {
    setIsScanning(false);
    onScanned(qr);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="qr-code-outline" size={22} color={colors.primaryLight} />
            <Text style={styles.headerTitle}>SCAN MACHINE QR CODE</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textMain} />
          </TouchableOpacity>
        </View>

        {/* Camera View Area */}
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39'],
              }}
              onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <View style={styles.laserLine} />
                </View>
                <Text style={styles.scanPrompt}>Align camera over machine passport QR code</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={48} color={colors.warning} />
              <Text style={styles.permTitle}>Camera Permission Required</Text>
              <Text style={styles.permDesc}>
                To scan hardware QR tags in real-time, please grant camera access.
              </Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual QR & Quick Test Selector Bottom Area */}
        <View style={styles.bottomSection}>
          <Text style={styles.sectionLabel}>OR ENTER CODE MANUALLY</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. QR-01, MCH-001 or QR hash"
              placeholderTextColor={colors.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleManualSubmit}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Quick factory machinery chips */}
          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>FACTORY REGISTERED MACHINES</Text>
          {isLoadingRecent ? (
            <ActivityIndicator size="small" color={colors.primaryLight} style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {recentMachines.map((m, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => handleSelectQuickMachine(m.qr || m.code)}
                >
                  <Ionicons name="hardware-chip-outline" size={14} color={colors.primaryLight} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.chipCode}>{m.code}</Text>
                    <Text style={styles.chipName} numberOfLines={1}>
                      {m.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primaryLight,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scanPrompt: {
    marginTop: 24,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
    marginTop: 12,
  },
  permDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  permBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomSection: {
    backgroundColor: colors.surface,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.textMain,
    fontSize: 14,
  },
  submitBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  chipCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  chipName: {
    fontSize: 10,
    color: colors.textSecondary,
    maxWidth: 120,
  },
});
