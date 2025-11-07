// src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { useProfilePermissions } from "../hooks/useProfilePermissions";
import { SignInScreen } from "../screens/auth/SignInScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { ScannerScreen } from "../screens/tickets/ScannerScreen";
import { ManualVerificationScreen } from "../screens/tickets/ManualVerificationScreen";
import { BiometricApprovalScreen } from "../screens/facial/BiometricApprovalScreen";
import { PedidosScreen } from "../screens/pedidos/PedidosScreen";
import { PedidoDetalhesScreen } from "../screens/pedidos/PedidoDetalhesScreen";
import { CriarPedidoScreen } from "../screens/pedidos/components/CriarPedidoScreen";
import { RecusarPedidoScreen } from "../screens/pedidos/components/RecusarPedidoScreen";
import { CancelarPedidoScreen } from "../screens/pedidos/components/CancelarPedidoScreen";
import { QRCodeScreen } from "../screens/pedidos/QRCodeScreen";
import { QRScannerScreen } from "../screens/pedidos/QRScannerScreen";
import { EntregarItensScreen } from "../screens/pedidos/EntregarItensScreen";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { routes } from "./routes";
import { PedidoSimplificado } from "../types/pedidos";

export type RootStackParamList = {
  // Autenticação
  SignIn: undefined;

  // Principal
  Home: undefined;

  // Tickets
  Scanner: undefined;
  ManualVerification: undefined;
  BiometricApproval: {
    // Modo de operação
    mode?: "pedido" | "avulso";
    // Parâmetros para modo pedido
    pedidoId?: number;
    itemId?: number;
    // Callback de sucesso
    onSuccess?: () => void;
  };

  // Pedidos
  Pedidos: undefined;
  PedidoDetalhes: {
    pedidoId: number;
  };
  CriarPedido: undefined;
  AdicionarItens: {
    pedidoId: number;
  };
  RecusarPedido: {
    pedido: PedidoSimplificado;
  };
  CancelarPedido: {
    pedido: PedidoSimplificado;
  };
  QRCode: {
    pedido: PedidoSimplificado;
  };
  QRScanner: {
    pedido: PedidoSimplificado;
  };
  EntregarItens: {
    pedidoId: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { canAccessTickets, canAccessOrders } = useProfilePermissions();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {user ? (
          <>
            {/* Tela Principal */}
            <Stack.Screen name={routes.HOME} component={HomeScreen} />

            {/* Tela de Reconhecimento Facial - DISPONÍVEL PARA TODOS */}
            {/* Esta tela é usada tanto para tickets quanto para pedidos */}
            <Stack.Screen
              name={routes.BIOMETRIC_APPROVAL}
              component={BiometricApprovalScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />

            {/* Módulo de Tickets */}
            {canAccessTickets() && (
              <>
                <Stack.Screen
                  name={routes.SCANNER}
                  component={ScannerScreen}
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name={routes.MANUAL_VERIFICATION}
                  component={ManualVerificationScreen}
                />
              </>
            )}

            {/* Módulo de Pedidos */}
            {canAccessOrders() && (
              <>
                {/* Lista de Pedidos */}
                <Stack.Screen name={routes.PEDIDOS} component={PedidosScreen} />

                {/* Detalhes do Pedido */}
                <Stack.Screen
                  name={routes.PEDIDO_DETALHES}
                  component={PedidoDetalhesScreen}
                />

                {/* Criar Pedido (Modal) */}
                <Stack.Screen
                  name={routes.CRIAR_PEDIDO}
                  component={CriarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                {/* Recusar Pedido (Modal) */}
                <Stack.Screen
                  name={routes.RECUSAR_PEDIDO}
                  component={RecusarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                {/* Cancelar Pedido (Modal) */}
                <Stack.Screen
                  name={routes.CANCELAR_PEDIDO}
                  component={CancelarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                {/* QR Code do Pedido (Modal) */}
                <Stack.Screen
                  name={routes.QR_CODE}
                  component={QRCodeScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                {/* Scanner de QR Code (Fullscreen Modal) */}
                <Stack.Screen
                  name={routes.QR_SCANNER}
                  component={QRScannerScreen}
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />

                {/* Entregar Itens do Pedido */}
                <Stack.Screen
                  name={routes.ENTREGAR_ITENS}
                  component={EntregarItensScreen}
                />
              </>
            )}
          </>
        ) : (
          /* Tela de Login */
          <Stack.Screen name={routes.SIGN_IN} component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.light,
  },
});
