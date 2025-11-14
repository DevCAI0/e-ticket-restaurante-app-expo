import "./index.css";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ToastContainer } from "./src/components/common/ToastContainer";
import { useHorarioNotificacoes } from "./src/hooks/useHorarioNotificacoes";

function AppContent() {
  // Este hook irá verificar horários e enviar notificações locais
  useHorarioNotificacoes();

  return (
    <>
      <AppNavigator />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
