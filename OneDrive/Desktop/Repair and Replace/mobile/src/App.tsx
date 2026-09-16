import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QRScannerModal } from './components/QRScannerModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MachineDetailScreen } from './screens/MachineDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SparesCatalogScreen } from './screens/SparesCatalogScreen';
import { TicketAttendScreen } from './screens/TicketAttendScreen';
import { ThemeColors } from './theme/colors';

type ScreenType =
  | 'dashboard'
  | 'machine-detail'
  | 'ticket-attend'
  | 'spares-catalog'
  | 'settings';

const MainNavigator: React.FC = () => {
  const { user, isInitializing } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>(undefined);
  const [scannedQRHash, setScannedQRHash] = useState<string | undefined>(undefined);
  const [selectedTicketId, setSelectedTicketId] = useState<number | undefined>(undefined);
  const [globalScannerVisible, setGlobalScannerVisible] = useState(false);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
        <Text style={styles.loadingText}>Initializing Workshop System...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Navigation callbacks
  const handleOpenTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setCurrentScreen('ticket-attend');
  };

  const handleOpenMachine = (machineId: number) => {
    setSelectedMachineId(machineId);
    setScannedQRHash(undefined);
    setCurrentScreen('machine-detail');
  };

  const handleQRScanned = (qrHash: string) => {
    setScannedQRHash(qrHash);
    setSelectedMachineId(undefined);
    setCurrentScreen('machine-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentArea}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onOpenTicket={handleOpenTicket}
            onOpenMachine={handleOpenMachine}
            onOpenSparesCatalog={() => setCurrentScreen('spares-catalog')}
            onQRScanned={handleQRScanned}
            onOpenSettings={() => setCurrentScreen('settings')}
          />
        )}

        {currentScreen === 'machine-detail' && (
          <MachineDetailScreen
            machineId={selectedMachineId}
            qrHash={scannedQRHash}
            onBack={handleBackToDashboard}
            onAttendTicket={handleOpenTicket}
          />
        )}

        {currentScreen === 'ticket-attend' && selectedTicketId && (
          <TicketAttendScreen
            ticketId={selectedTicketId}
            onBack={handleBackToDashboard}
            onMachineDetails={handleOpenMachine}
          />
        )}

        {currentScreen === 'spares-catalog' && (
          <SparesCatalogScreen onBack={handleBackToDashboard} />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen onBack={handleBackToDashboard} />
        )}
      </View>

      {/* Global Bottom Tab Bar with 4 Navigation Items */}
      <View style={styles.tabBar}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'dashboard' ? 'grid' : 'grid-outline'}
            size={22}
            color={currentScreen === 'dashboard' ? colors.primaryLight : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: currentScreen === 'dashboard' ? colors.primaryLight : colors.textMuted },
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Spares Catalog */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('spares-catalog')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'spares-catalog' ? 'cube' : 'cube-outline'}
            size={22}
            color={currentScreen === 'spares-catalog' ? colors.secondaryLight : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  currentScreen === 'spares-catalog' ? colors.secondaryLight : colors.textMuted,
              },
            ]}
          >
            Spares
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Elevated Center QR Scanner */}
        <TouchableOpacity
          style={styles.centerScanTab}
          onPress={() => setGlobalScannerVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.centerScanCircle}>
            <Ionicons name="qr-code" size={24} color="#fff" />
          </View>
          <Text style={styles.centerScanText}>Scan QR</Text>
        </TouchableOpacity>

        {/* Tab 4: Settings & Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={currentScreen === 'settings' ? colors.primaryLight : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: currentScreen === 'settings' ? colors.primaryLight : colors.textMuted },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        visible={globalScannerVisible}
        onClose={() => setGlobalScannerVisible(false)}
        onScanned={(qrHash) => {
          setGlobalScannerVisible(false);
          handleQRScanned(qrHash);
        }}
      />
    </SafeAreaView>
  );
};

const ThemedStatusBar: React.FC = () => {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <MainNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
    },
    contentArea: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      height: 60,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 4,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    tabText: {
      fontSize: 10,
      fontWeight: '700',
    },
    centerScanTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      top: -10,
    },
    centerScanCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primaryLight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    },
    centerScanText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMain,
      marginTop: 3,
    },
  });
