import { Animated, Dimensions, Platform } from "react-native";

const { width } = Dimensions.get("window");

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  animation: Animated.Value;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toastCounter = 0;

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  private show(message: string, type: "success" | "error" | "info") {
    const id = `toast-${++this.toastCounter}-${Date.now()}`;
    const animation = new Animated.Value(0);

    const toast: Toast = {
      id,
      message,
      type,
      animation,
    };

    this.toasts.push(toast);
    this.notify();

    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(type === "error" ? 4000 : 3000),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    });
  }

  success(message: string) {
    this.show(message, "success");
  }

  error(message: string) {
    this.show(message, "error");
  }

  info(message: string) {
    this.show(message, "info");
  }

  hide(id: string) {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast) {
      Animated.timing(toast.animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.notify();
      });
    }
  }
}

export const toastManager = new ToastManager();

export const showSuccessToast = (message: string) => {
  toastManager.success(message);
};

export const showErrorToast = (message: string) => {
  toastManager.error(message);
};

export const showInfoToast = (message: string) => {
  toastManager.info(message);
};
