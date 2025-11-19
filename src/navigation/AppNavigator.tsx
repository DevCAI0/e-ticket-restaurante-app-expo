import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { useProfilePermissions } from "../hooks/useProfilePermissions";
import { SignInScreen } from "../screens/auth/SignInScreen";
import HomeScreen from "../screens/home/HomeScreen";
import { ScannerScreen } from "../screens/tickets/ScannerScreen";
import { ManualVerificationScreen } from "../screens/tickets/ManualVerificationScreen";
import { TicketsListScreen } from "../screens/tickets/TicketsListScreen";
import { BiometricApprovalScreen } from "../screens/facial/BiometricApprovalScreen";
import { PedidosScreen } from "../screens/pedidos/PedidosScreen";
import { PedidoDetalhesScreen } from "../screens/pedidos/PedidoDetalhesScreen";
import { CriarPedidoScreen } from "../screens/pedidos/components/CriarPedidoScreen";
import { RecusarPedidoScreen } from "../screens/pedidos/components/RecusarPedidoScreen";
import { CancelarPedidoScreen } from "../screens/pedidos/components/CancelarPedidoScreen";
import { QRCodeScreen } from "../screens/pedidos/QRCodeScreen";
import { QRScannerScreen } from "../screens/pedidos/QRScannerScreen";
import { EntregarItensScreen } from "../screens/pedidos/EntregarItensScreen";
import { ScanTicketAvulsoScreen } from "../screens/pedidos/ScanTicketAvulsoScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { routes } from "./routes";
import { PedidoSimplificado } from "../types/pedidos";
import { setAuthErrorCallback } from "../lib/axios";

export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  Scanner: undefined;
  ManualVerification: undefined;
  TicketsList: undefined;
  BiometricApproval: {
    mode?: "pedido" | "avulso";
    pedidoId?: number;
    itemId?: number;
    onSuccess?: () => void;
  };
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
  ScanTicketAvulso: {
    pedidoId: number;
    itemId: number;
    onSuccess?: (ticketData: any) => void;
  };
  Ajustes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { canAccessTickets, canAccessOrders } = useProfilePermissions();

  useEffect(() => {
    setAuthErrorCallback(() => {
      logout();
    });
  }, [logout]);

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
            <Stack.Screen name={routes.HOME} component={HomeScreen} />

            <Stack.Screen name="Ajustes" component={SettingsScreen} />

            <Stack.Screen
              name={routes.BIOMETRIC_APPROVAL}
              component={BiometricApprovalScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />

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
                <Stack.Screen
                  name={routes.TICKETS_LIST}
                  component={TicketsListScreen}
                />
              </>
            )}

            {canAccessOrders() && (
              <>
                <Stack.Screen name={routes.PEDIDOS} component={PedidosScreen} />

                <Stack.Screen
                  name={routes.PEDIDO_DETALHES}
                  component={PedidoDetalhesScreen}
                />

                <Stack.Screen
                  name={routes.CRIAR_PEDIDO}
                  component={CriarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                <Stack.Screen
                  name={routes.RECUSAR_PEDIDO}
                  component={RecusarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                <Stack.Screen
                  name={routes.CANCELAR_PEDIDO}
                  component={CancelarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                <Stack.Screen
                  name={routes.QR_CODE}
                  component={QRCodeScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />

                <Stack.Screen
                  name={routes.QR_SCANNER}
                  component={QRScannerScreen}
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />

                <Stack.Screen
                  name={routes.ENTREGAR_ITENS}
                  component={EntregarItensScreen}
                />

                <Stack.Screen
                  name={routes.SCAN_TICKET_AVULSO}
                  component={ScanTicketAvulsoScreen}
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
              </>
            )}
          </>
        ) : (
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
