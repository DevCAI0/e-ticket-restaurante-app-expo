import "./index.css";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ToastContainer } from "./src/components/common/ToastContainer";
import { initializeFirebase } from "./src/config/firebase";

function AppContent() {
  return (
    <>
      <AppNavigator />
      <ToastContainer />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Inicializa Firebase quando o app carrega
    initializeFirebase().then((fcmToken) => {
      if (fcmToken) {
        console.log("✅ Firebase inicializado com sucesso!");
      } else {
        console.log("⚠️ Firebase: Sem token FCM (permissão negada ou erro)");
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
