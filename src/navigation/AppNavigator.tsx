// src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { SignInScreen } from "../screens/auth/SignInScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { ScannerScreen } from "../screens/tickets/ScannerScreen";
import { ManualVerificationScreen } from "../screens/tickets/ManualVerificationScreen";
import { BiometricApprovalScreen } from "../screens/facial/BiometricApprovalScreen";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { routes } from "./routes";

export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  Scanner: undefined;
  ManualVerification: undefined;
  BiometricApproval: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

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
            <Stack.Screen name="Home" component={HomeScreen} />
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
