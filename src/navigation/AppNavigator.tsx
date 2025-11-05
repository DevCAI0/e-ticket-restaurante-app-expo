// src/navigation/AppNavigator.tsx - Atualizado com permissões
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
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { routes } from "./routes";
import { PedidoSimplificado } from "../types/pedidos";

export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  Scanner: undefined;
  ManualVerification: undefined;
  BiometricApproval: undefined;
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
  EntregarFuncionario: {
    pedido: PedidoSimplificado;
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
            {/* Home - Todos têm acesso */}
            <Stack.Screen name="Home" component={HomeScreen} />

            {/* Tickets Routes - Apenas para usuários com permissão */}
            {canAccessTickets() && (
              <>
                <Stack.Screen
                  name="Scanner"
                  component={ScannerScreen}
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="ManualVerification"
                  component={ManualVerificationScreen}
                />
                <Stack.Screen
                  name="BiometricApproval"
                  component={BiometricApprovalScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
              </>
            )}

            {/* Pedidos Routes - Apenas para usuários com permissão */}
            {canAccessOrders() && (
              <>
                <Stack.Screen name="Pedidos" component={PedidosScreen} />
                <Stack.Screen
                  name="PedidoDetalhes"
                  component={PedidoDetalhesScreen}
                />
                <Stack.Screen
                  name="CriarPedido"
                  component={CriarPedidoScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
                {/* TODO: Adicionar as outras telas de pedidos quando estiverem prontas */}
              </>
            )}
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
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
