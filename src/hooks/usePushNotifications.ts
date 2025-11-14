// src/hooks/usePushNotifications.ts

import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "../lib/axios";
import { showSuccessToast, showErrorToast } from "../lib/toast";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  registerForPushNotifications: () => Promise<string | null>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Notificação recebida:", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Usuário interagiu com notificação:", response);

        const data = response.notification.request.content.data;

        if (data.action === "abrir_pedido" && data.pedido_id) {
          console.log("Navegar para pedido:", data.pedido_id);
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        const msg = "Notificações push só funcionam em dispositivos físicos";
        setError(msg);
        console.warn(msg);
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        const msg = "Permissão para notificações foi negada";
        setError(msg);
        showErrorToast(msg);
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "1ff9ff6d-ca7d-46f9-b842-a6079304a191",
      });

      const token = tokenData.data;
      console.log("🔑 Push Token obtido:", token);

      try {
        await api.post("/push-token", {
          push_token: token,
          device_type: Platform.OS,
          device_id: Device.deviceName || Device.modelId || "unknown",
        });

        console.log("✅ Token registrado no backend");
        showSuccessToast("Notificações configuradas");
        setExpoPushToken(token);
        return token;
      } catch (apiError) {
        console.error("❌ Erro ao registrar token no backend:", apiError);
        showErrorToast("Erro ao registrar notificações");
        return null;
      }
    } catch (err) {
      console.error("❌ Erro ao registrar notificações:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      showErrorToast("Erro ao configurar notificações");
      return null;
    }
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  return {
    expoPushToken,
    notification,
    error,
    registerForPushNotifications,
  };
}

export function useTestNotification() {
  const [isSending, setIsSending] = useState(false);

  const sendTestNotification = async (): Promise<boolean> => {
    setIsSending(true);
    try {
      const response = await api.post("/push-token/test");

      if (response.data.success) {
        showSuccessToast("Notificação de teste enviada!");
        return true;
      } else {
        showErrorToast("Erro ao enviar notificação de teste");
        return false;
      }
    } catch (error) {
      console.error("Erro ao testar notificação:", error);
      showErrorToast("Erro ao enviar notificação de teste");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendTestNotification,
    isSending,
  };
}
