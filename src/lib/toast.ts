// src/lib/toast.ts
import { Alert, ToastAndroid, Platform } from "react-native";

export const showSuccessToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("Sucesso", message);
  }
};

export const showErrorToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert("Erro", message);
  }
};

export const showInfoToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("Info", message);
  }
};
