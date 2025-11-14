import { useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import { useProfilePermissions } from "../../hooks/useProfilePermissions";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";
import { Card } from "../../components/ui/Card";
import { Header } from "../../components/common/Header";
import { BottomNav } from "../../components/common/BottomNav";
import { EarningsChart } from "../../components/home/components/EarningsChart";
import { ActionCard } from "../../components/home/components/ActionCard";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { colors } from "../../constants/colors";

type NavProp = NavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { logout } = useAuth();
  const { isEstablishment, canAccessTickets, user } = useProfilePermissions();
  const {
    count: pedidosPendentes,
    hasNewOrders,
    markAsViewed,
  } = usePedidosPendentes();
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = async () => {
    await logout();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    switch (tab) {
      case "pedidos":
        markAsViewed();
        navigation.navigate("Pedidos");
        break;
      case "tickets":
        navigation.navigate("TicketsList");
        break;
      case "ajustes":
        navigation.navigate("Ajustes");
        break;
    }
  };

  if (isEstablishment()) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header onLogout={handleLogout} />

        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
            <Text style={styles.establishmentName}>
              {user?.nome_estabelecimento || "Estabelecimento"}
            </Text>
            <Text style={styles.welcomeDescription}>
              Use a navegação abaixo para acessar os pedidos ou configurações.
            </Text>
          </View>
        </View>

        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pedidosPendentes={pedidosPendentes}
          hasNewOrders={hasNewOrders}
        />
      </SafeAreaView>
    );
  }

  const getDashboardActions = () => {
    const actions: Array<{
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      color: string;
      onPress: () => void;
    }> = [];

    if (canAccessTickets()) {
      actions.push(
        {
          icon: "scan",
          title: "Ler Tickets",
          color: "#FB923C",
          onPress: () => navigation.navigate("Scanner"),
        },
        {
          icon: "search",
          title: "Manualmente",
          color: "#3B82F6",
          onPress: () => navigation.navigate("ManualVerification"),
        },
        {
          icon: "checkmark-circle",
          title: "Aprovar Tickets",
          color: "#22C55E",
          onPress: () => navigation.navigate("BiometricApproval", {}),
        }
      );
    }

    return actions;
  };

  const dashboardActions = getDashboardActions();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onLogout={handleLogout} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Nome do Restaurante */}
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>
            {user?.nome_restaurante || "Restaurante"}
          </Text>
        </View>

        {/* Seção de Resumo */}
        <Card style={styles.chartCard}>
          <EarningsChart />
        </Card>

        {/* Actions Grid */}
        {dashboardActions.length > 0 && (
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
        )}
      </ScrollView>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pedidosPendentes={pedidosPendentes}
        hasNewOrders={hasNewOrders}
      />
    </SafeAreaView>
  );
}

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
    paddingTop: 8,
    paddingBottom: 32,
  },
  restaurantHeader: {
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.muted.dark,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  welcomeContent: {
    maxWidth: 400,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.text.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  establishmentName: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.muted.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 16,
    color: colors.muted.light,
    textAlign: "center",
    lineHeight: 24,
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
