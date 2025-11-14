// src/screens/tickets/TicketsListScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useTicketsList } from "../../hooks/useTicketsList";
import { TicketCard } from "../../components/tickets/components/TicketCard";
import { TicketCardSkeleton } from "../../components/tickets/components/TicketCardSkeleton";
import { TicketFilters } from "../../components/tickets/components/TicketFilters";
import { Header } from "../../components/common/Header";
import { BottomNav } from "../../components/common/BottomNav";
import { Button } from "../../components/ui/Button";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TicketsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const { tickets, loading, hasMore, error, loadMoreTickets, refreshTickets } =
    useTicketsList();
  const {
    count: pedidosPendentes,
    hasNewOrders,
    markAsViewed,
  } = usePedidosPendentes();

  const [activeTab, setActiveTab] = useState("tickets");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [mealType, setMealType] = useState("all");
  const [loadingMore, setLoadingMore] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTickets();
    setRefreshing(false);
  }, [refreshTickets]);

  const handleLoadMore = async () => {
    if (hasMore && !loading && !loadingMore) {
      setLoadingMore(true);
      await loadMoreTickets();
      setLoadingMore(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      navigation.navigate("Home");
    } else if (tab === "pedidos") {
      markAsViewed();
      navigation.navigate("Pedidos");
    } else if (tab === "ajustes") {
      navigation.navigate("Ajustes");
    }
  };

  // Normalizar tickets para o formato esperado pelo TicketCard
  const normalizedTickets = tickets.map((ticketItem) => ({
    id: ticketItem.data.id,
    numero: ticketItem.data.numero,
    funcionario: ticketItem.data.funcionario
      ? {
          id_funcionario: ticketItem.data.funcionario.id_funcionario,
          nome: ticketItem.data.funcionario.nome,
          cpf: ticketItem.data.funcionario.cpf,
        }
      : null,
    tipo_refeicao: ticketItem.data.tipo_refeicao,
    status: ticketItem.data.status,
    status_texto: ticketItem.data.status_texto,
    data_emissao: ticketItem.data.data_emissao,
    expiracao: ticketItem.data.expiracao || ticketItem.data.data_validade || "",
    tempo_restante: ticketItem.data.tempo_restante,
    data_hora_leitura_restaurante:
      ticketItem.data.data_hora_leitura_restaurante,
    usuario_leitura: ticketItem.data.usuario_leitura,
    // ✅ NOVOS CAMPOS de conferência (para tickets avulsos)
    id_usuario_leitura_conferencia:
      ticketItem.data.id_usuario_leitura_conferencia,
    data_hora_leitura_conferencia:
      ticketItem.data.data_hora_leitura_conferencia,
    usuario_conferencia: ticketItem.data.usuario_conferencia,
    tipo: ticketItem.tipo,
    codigo: ticketItem.data.codigo,
  }));

  // Aplicar filtros
  const filteredTickets = normalizedTickets.filter((ticket) => {
    const searchMatch =
      search.toLowerCase() === "" ||
      ticket.numero.toString().includes(search.toLowerCase()) ||
      (ticket.funcionario &&
        ticket.funcionario.nome.toLowerCase().includes(search.toLowerCase())) ||
      (ticket.codigo &&
        ticket.codigo.toLowerCase().includes(search.toLowerCase()));

    const mealTypeMatch =
      mealType === "all" || ticket.tipo_refeicao === mealType;

    return searchMatch && mealTypeMatch;
  });

  const renderContent = () => {
    if (loading && tickets.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
        </View>
      );
    }

    if (error && tickets.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={colors.destructive.light}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" onPress={refreshTickets}>
            Tentar novamente
          </Button>
        </View>
      );
    }

    if (filteredTickets.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="ticket-outline"
            size={48}
            color={colors.muted.light}
          />
          <Text style={styles.emptyText}>
            {search || mealType !== "all"
              ? "Nenhum ticket encontrado com os filtros aplicados"
              : "Nenhum ticket encontrado"}
          </Text>
        </View>
      );
    }

    return (
      <>
        {filteredTickets.map((ticket, index) => (
          <TicketCard
            key={`${ticket.id}-${ticket.numero}-${index}`}
            numero={ticket.numero}
            funcionario={ticket.funcionario}
            tipo_refeicao={ticket.tipo_refeicao}
            data_emissao={ticket.data_emissao}
            status_texto={ticket.status_texto}
            data_hora_leitura_restaurante={ticket.data_hora_leitura_restaurante}
            usuario_leitura={ticket.usuario_leitura}
            // ✅ NOVOS PROPS de conferência (para tickets avulsos)
            data_hora_leitura_conferencia={ticket.data_hora_leitura_conferencia}
            usuario_conferencia={ticket.usuario_conferencia}
            tipo={ticket.tipo}
          />
        ))}

        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingMoreText}>
              Carregando mais tickets...
            </Text>
          </View>
        )}

        {hasMore && !loadingMore && filteredTickets.length > 0 && (
          <Button
            variant="ghost"
            onPress={handleLoadMore}
            style={styles.loadMoreButton}
          >
            Ver Mais
          </Button>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.light} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tickets</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={refreshing ? colors.muted.light : colors.text.light}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <TicketFilters
          onSearchChange={setSearch}
          onMealTypeChange={setMealType}
        />

        <View style={styles.ticketsHeader}>
          <Text style={styles.ticketsCount}>
            Histórico de Tickets ({filteredTickets.length})
          </Text>
        </View>

        {renderContent()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.light,
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  ticketsHeader: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
  },
  loadingContainer: {
    marginTop: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.destructive.light,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted.light,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: colors.muted.light,
  },
  loadMoreButton: {
    marginVertical: 16,
  },
});
