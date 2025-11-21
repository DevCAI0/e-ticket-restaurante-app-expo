import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

export async function initializeFirebase() {
  try {
    console.log("🔥 Inicializando Firebase...");

    // Solicitar permissão para notificações
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("✅ Firebase: Permissão concedida");

      // Obter token FCM
      const fcmToken = await messaging().getToken();
      console.log(
        "✅ Firebase FCM Token obtido:",
        fcmToken.substring(0, 50) + "..."
      );

      return fcmToken;
    } else {
      console.log("❌ Firebase: Permissão negada");
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
    return null;
  }
}

// Configurar Expo Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Handler para notificações em foreground (app aberto)
messaging().onMessage(async (remoteMessage) => {
  console.log(
    "📬 Notificação recebida em foreground:",
    remoteMessage.notification?.title
  );

  // Mostrar notificação local quando o app está aberto
  await Notifications.scheduleNotificationAsync({
    content: {
      title: remoteMessage.notification?.title || "Nova notificação",
      body: remoteMessage.notification?.body || "",
      data: remoteMessage.data,
      sound: "default",
    },
    trigger: null, // Mostrar imediatamente
  });
});

// Handler para quando o app abre via notificação (app em background)
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log(
    "📬 App aberto via notificação:",
    remoteMessage.notification?.title
  );
  // Aqui você pode navegar para uma tela específica baseado em remoteMessage.data
});

// Verificar se o app foi aberto por uma notificação (app estava fechado)
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      console.log(
        "📬 App iniciado via notificação:",
        remoteMessage.notification?.title
      );
      // Aqui você pode navegar para uma tela específica baseado em remoteMessage.data
    }
  });

// Handler para token refresh
messaging().onTokenRefresh(async (token) => {
  console.log("🔄 Firebase token atualizado:", token.substring(0, 50) + "...");
  // Aqui você deveria enviar o novo token para o backend
  // Mas isso será tratado pela tela de Ajustes quando o usuário abrir
});
