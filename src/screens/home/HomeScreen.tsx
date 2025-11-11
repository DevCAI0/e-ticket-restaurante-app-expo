// src/screens/home/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const { isEstablishment, canAccessTickets, canAccessOrders, user } =
    useProfilePermissions();
  const {
    count: pedidosPendentes,
    hasNewOrders,
    markAsViewed,
  } = usePedidosPendentes();
  const [activeTab, setActiveTab] = useState("home");

  // Log para debug quando o componente montar ou user mudar
  useEffect(() => {
    if (user) {
      console.log("🏠 [HOME] Dados do usuário na HomeScreen:", {
        id: user.id,
        nome: user.nome,
        login: user.login,
        id_perfil: user.id_perfil,
        perfil_descricao: user.perfil_descricao,
        id_estabelecimento: user.id_estabelecimento,
        nome_estabelecimento: user.nome_estabelecimento,
        id_restaurante: user.id_restaurante,
        nome_restaurante: user.nome_restaurante,
      });

      console.log("🏠 [HOME] Verificações de perfil:", {
        isEstablishment: isEstablishment(),
        canAccessTickets: canAccessTickets(),
        canAccessOrders: canAccessOrders(),
      });

      if (isEstablishment()) {
        console.log("🏠 [HOME] 🏢 Renderizando interface de ESTABELECIMENTO");
      } else {
        console.log("🏠 [HOME] 🍽️ Renderizando dashboard de RESTAURANTE");
      }
    } else {
      console.log("🏠 [HOME] ⚠️ Usuário não encontrado");
    }
  }, [user, isEstablishment, canAccessTickets, canAccessOrders]);

  const handleLogout = async () => {
    console.log("🏠 [HOME] Fazendo logout...");
    await logout();
  };

  const handleTabChange = (tab: string) => {
    console.log("🏠 [HOME] Mudando para tab:", tab);
    setActiveTab(tab);

    // Navegar para a tela correspondente
    if (tab === "pedidos") {
      markAsViewed(); // Marca notificações como vistas
      navigation.navigate("Pedidos");
    } else if (tab === "ajustes") {
      navigation.navigate("Ajustes");
    }
    // Adicione outras navegações conforme necessário
  };

  // Interface minimalista para estabelecimento (perfil 1)
  if (isEstablishment()) {
    console.log("🏠 [HOME] ✅ Exibindo tela minimalista para estabelecimento");
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

  // Dashboard completo para outros perfis (restaurante)
  console.log("🏠 [HOME] ✅ Exibindo dashboard completo para restaurante");

  const getDashboardActions = () => {
    const actions = [];

    // Ações de Tickets - apenas para quem tem permissão
    if (canAccessTickets()) {
      console.log("🏠 [HOME] Adicionando ações de TICKETS");
      actions.push(
        {
          icon: "scan" as keyof typeof Ionicons.glyphMap,
          title: "Ler Tickets",
          color: "#FB923C",
          onPress: () => navigation.navigate("Scanner"),
        },
        {
          icon: "search" as keyof typeof Ionicons.glyphMap,
          title: "Manualmente",
          color: "#3B82F6",
          onPress: () => navigation.navigate("ManualVerification"),
        },
        {
          icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
          title: "Aprovar Tickets",
          color: "#22C55E",
          onPress: () => navigation.navigate("BiometricApproval"),
        }
      );
    }

    // Ação de Pedidos - para quem tem permissão
    if (canAccessOrders()) {
      console.log("🏠 [HOME] Adicionando ação de PEDIDOS");
      actions.push({
        icon: "receipt" as keyof typeof Ionicons.glyphMap,
        title: "Ver Pedidos",
        color: "#F97316",
        onPress: () => {
          markAsViewed();
          navigation.navigate("Pedidos");
        },
        badge: pedidosPendentes > 0 ? pedidosPendentes : undefined,
      });
    }

    console.log("🏠 [HOME] Total de ações disponíveis:", actions.length);
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
        {/* Mensagem de boas-vindas */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>Olá, {user?.nome}!</Text>
          {user?.nome_restaurante && (
            <Text style={styles.restaurantName}>{user.nome_restaurante}</Text>
          )}
        </View>

        {/* Gráfico de Faturamento */}
        <Card style={styles.chartCard}>
          <EarningsChart />
        </Card>

        {/* Ações disponíveis baseadas em permissões */}
        {dashboardActions.length > 0 && (
          <View style={styles.actionsGrid}>
            {dashboardActions.map((action, index) => (
              <ActionCard
                key={index}
                icon={action.icon}
                title={action.title}
                color={action.color}
                onPress={action.onPress}
                badge={action.badge}
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
  // Estilos para a interface minimalista (estabelecimento)
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
  // Estilos para o dashboard completo (restaurante)
  headerSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.dark,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    color: colors.muted.dark,
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
