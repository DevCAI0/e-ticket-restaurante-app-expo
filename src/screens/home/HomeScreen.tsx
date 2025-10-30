// src/screens/home/HomeScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/ui/Card";
import { Header } from "../../components/common/Header";
import { BottomNav } from "../../components/common/BottomNav";
import { EarningsChart } from "../../components/home/components/EarningsChart";
import { ActionCard } from "../../components/home/components/ActionCard";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { routes } from "../../navigation/routes";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = async () => {
    await logout();
  };

  const dashboardActions = [
    {
      icon: "scan" as keyof typeof Ionicons.glyphMap,
      title: "Ler Tickets",
      color: "#FB923C",
      onPress: () => navigation.navigate("Scanner" as any),
    },
    {
      icon: "search" as keyof typeof Ionicons.glyphMap,
      title: "Manualmente",
      color: "#3B82F6",
      onPress: () => navigation.navigate("ManualVerification" as any),
    },
    {
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
      title: "Aprovar Tickets",
      color: "#22C55E",
      onPress: () => navigation.navigate("BiometricApproval" as any),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onLogout={handleLogout} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.chartCard}>
          <EarningsChart />
        </Card>

        <View style={styles.actionsGrid}>
          {dashboardActions.map((action, index) => (
            <ActionCard
              key={index}
              icon={action.icon}
              title={action.title}
              color={action.color}
              onPress={action.onPress}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  chartCard: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
