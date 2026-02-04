/**
 * Network State Hook
 *
 * Monitors network connectivity and provides offline handling.
 * Works with or without @react-native-community/netinfo installed.
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

// Type for NetInfo state
interface NetInfoStateType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

// Lazy import NetInfo to handle cases where it's not installed
let NetInfo: {
  addEventListener: (callback: (state: NetInfoStateType) => void) => () => void;
  fetch: () => Promise<NetInfoStateType>;
} | null = null;

try {
  // Dynamic require to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo not available, will use fallback
}

export function useNetworkState() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume online by default
    isInternetReachable: null,
    type: null,
    isWifi: false,
    isCellular: false,
  });

  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  const handleNetworkChange = useCallback((state: NetInfoStateType) => {
    const status: NetworkStatus = {
      isConnected: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    };

    setNetworkStatus(status);

    // Show offline banner when disconnected
    if (!status.isConnected) {
      setShowOfflineBanner(true);
    } else if (showOfflineBanner) {
      // Brief delay before hiding banner after reconnection
      setTimeout(() => setShowOfflineBanner(false), 2000);
    }
  }, [showOfflineBanner]);

  useEffect(() => {
    // If NetInfo is not available, assume always online
    if (!NetInfo) {
      return;
    }

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    return () => unsubscribe();
  }, [handleNetworkChange]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!NetInfo) {
      return true; // Assume online if NetInfo not available
    }
    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  }, []);

  const dismissOfflineBanner = useCallback(() => {
    setShowOfflineBanner(false);
  }, []);

  return {
    ...networkStatus,
    showOfflineBanner,
    dismissOfflineBanner,
    checkConnection,
  };
}

/**
 * Simple hook that just returns connection status
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // If NetInfo is not available, assume always online
    if (!NetInfo) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
