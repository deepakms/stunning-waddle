/**
 * Toast Hook
 *
 * Provides global toast functionality through React context.
 * Use showToast to display notifications throughout the app.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (
    message: string,
    options?: {
      type?: ToastType;
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ) => void;
  showSuccess: (message: string) => void;
  showError: (message: string, onRetry?: () => void) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = useCallback(
    (
      message: string,
      options?: {
        type?: ToastType;
        duration?: number;
        action?: { label: string; onPress: () => void };
      }
    ) => {
      setToast({
        visible: true,
        message,
        type: options?.type ?? 'info',
        duration: options?.duration ?? 3000,
        action: options?.action,
      });
    },
    []
  );

  const showSuccess = useCallback((message: string) => {
    showToast(message, { type: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string, onRetry?: () => void) => {
    showToast(message, {
      type: 'error',
      duration: 5000,
      action: onRetry ? { label: 'Retry', onPress: onRetry } : undefined,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, { type: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, { type: 'info' });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onDismiss={hideToast}
        action={toast.action}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
