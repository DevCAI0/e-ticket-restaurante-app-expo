import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { toastManager } from "../../lib/toast";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  animation: Animated.Value;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastStyle = (type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        return styles.successToast;
      case "error":
        return styles.errorToast;
      case "info":
        return styles.infoToast;
      default:
        return styles.infoToast;
    }
  };

  const getIcon = (type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "i";
      default:
        return "i";
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => {
        const translateY = toast.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        });

        const opacity = toast.animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 1],
        });

        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toastWrapper,
              {
                transform: [{ translateY }],
                opacity,
                top: Platform.OS === "ios" ? 60 + index * 70 : 20 + index * 70,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toastManager.hide(toast.id)}
              style={[styles.toast, getToastStyle(toast.type)]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getIcon(toast.type)}</Text>
              </View>
              <Text style={styles.message} numberOfLines={3}>
                {toast.message}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toastWrapper: {
    position: "absolute",
    right: 16,
    left: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  successToast: {
    backgroundColor: "#10B981",
  },
  errorToast: {
    backgroundColor: "#EF4444",
  },
  infoToast: {
    backgroundColor: "#3B82F6",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
});
