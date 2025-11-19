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
    configurarCanalAndroid();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Notificação recebida:", {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
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

  const configurarCanalAndroid = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Pedidos e Notificações",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      console.log("✅ Canal de notificação Android configurado");
    }
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      console.log("🔔 [REGISTER] Iniciando registro...");

      if (!Device.isDevice) {
        const msg = "Notificações push só funcionam em dispositivos físicos";
        setError(msg);
        console.warn(msg);
        return null;
      }

      console.log("🔔 [REGISTER] Dispositivo físico confirmado");

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log("🔔 [REGISTER] Status de permissão:", existingStatus);

      if (existingStatus !== "granted") {
        console.log("🔔 [REGISTER] Solicitando permissão...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("🔔 [REGISTER] Nova permissão:", status);
      }

      if (finalStatus !== "granted") {
        const msg = "Permissão para notificações foi negada";
        setError(msg);
        showErrorToast(msg);
        return null;
      }

      console.log("🔔 [REGISTER] Permissão concedida - gerando token...");

      let token: string;

      if (__DEV__) {
        token = `ExponentPushToken[dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}]`;
        console.log("🛠️ [REGISTER] Token de DEV gerado:", token);
      } else {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: "1ff9ff6d-ca7d-46f9-b842-a6079304a191",
          });
          token = tokenData.data;
          console.log(
            "🔑 [REGISTER] Token de PRODUÇÃO obtido:",
            token.substring(0, 50) + "..."
          );
        } catch (tokenError: any) {
          console.error(
            "❌ [REGISTER] Erro ao obter token:",
            tokenError.message
          );

          token = `ExponentPushToken[fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}]`;
          console.log("⚠️ [REGISTER] Usando token fallback:", token);
        }
      }

      try {
        console.log("📤 [REGISTER] Enviando token para backend...");
        const response = await api.post("/push-token", {
          push_token: token,
          device_type: Platform.OS,
          device_id: Device.deviceName || Device.modelId || "unknown",
        });

        console.log("✅ [REGISTER] Resposta do backend:", response.data);

        if (response.data.success) {
          setExpoPushToken(token);

          if (response.data.data?.is_dev_token) {
            console.log("⚠️ Token de desenvolvimento registrado");
            showSuccessToast("Modo dev - Use notificações locais");
          } else {
            console.log("✅ Token de produção registrado");
            showSuccessToast("Notificações configuradas!");
          }

          return token;
        } else {
          console.error("❌ [REGISTER] Backend recusou:", response.data);
          return null;
        }
      } catch (apiError: any) {
        console.error("❌ [REGISTER] Erro ao registrar no backend:", {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message,
        });
        return null;
      }
    } catch (err: any) {
      console.error("❌ [REGISTER] Erro geral:", err.message);
      return null;
    }
  };

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
      console.log("📤 [TEST] Enviando notificação de teste...");

      if (__DEV__) {
        console.log("🛠️ [TEST] Modo DEV - Enviando notificação local");

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Teste de Notificação (Local)",
            body: "Esta é uma notificação LOCAL de teste. Em produção, virá do servidor!",
            data: { teste: true, tipo: "local" },
            sound: "default",
          },
          trigger: { seconds: 1 },
        });

        console.log("✅ [TEST] Notificação local agendada");
        showSuccessToast("Notificação local enviada!");
        return true;
      }

      const response = await api.post("/push-token/test");

      console.log("📥 [TEST] Resposta do backend:", response.data);

      if (response.data.success) {
        showSuccessToast("Notificação de teste enviada!");
        return true;
      } else {
        console.error("❌ [TEST] Falha ao enviar:", response.data);
        showErrorToast("Erro ao enviar notificação de teste");
        return false;
      }
    } catch (error: any) {
      console.error("❌ [TEST] Erro ao testar notificação:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
