// src/screens/pedidos/PedidosScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  PedidoSimplificado,
  PedidosFilters,
  PedidosListResponse,
  PedidoItem,
} from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { useAuth } from "../../hooks/useAuth";
import { useProfilePermissions } from "../../hooks/useProfilePermissions";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { PedidoCard } from "./components/PedidoCard";
import { colors } from "../../constants/colors";
import { BottomNav } from "../../components/common/BottomNav";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";

interface PedidosScreenProps {
  navigation: any;
  route?: any;
}

export function PedidosScreen({ navigation, route }: PedidosScreenProps) {
  const { user } = useAuth();
  const { isEstablishment, isRestaurant } = useProfilePermissions();

  const {
    count: pedidosPendentes,
    hasNewOrders,
    markAsViewed,
  } = usePedidosPendentes();
  const [activeTab, setActiveTab] = useState("pedidos");

  const [pedidos, setPedidos] = useState<PedidoSimplificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PedidosFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [ticketsStatus, setTicketsStatus] = useState<{
    [key: number]: boolean;
  }>({});
  const [loadingActions, setLoadingActions] = useState<{
    [key: number]: string;
  }>({});

  const isInitialLoad = useRef(true);
  const isMounted = useRef(true);

  const isEstabelecimento = isEstablishment();
  const isRestaurante = isRestaurant();

  const getUserType = () => {
    if (isEstabelecimento) return "estabelecimento";
    if (isRestaurante) return "restaurante";
    return "indefinido";
  };

  const userType = getUserType();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      markAsViewed();
      if (!isInitialLoad.current) {
        loadPedidos(true);
      }
    });

    return unsubscribe;
  }, [navigation, markAsViewed]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkTicketsStatus = async (
    pedidosParaVerificar: PedidoSimplificado[]
  ) => {
    const statusMap: { [key: number]: boolean } = {};

    for (const pedido of pedidosParaVerificar) {
      if (pedido.status === 5) {
        try {
          const response = await PedidosAPI.obterPedido(pedido.id);
          if (response.success && response.pedido.itensPedido) {
            const todosEntregues = response.pedido.itensPedido.every(
              (
                item: PedidoItem & {
                  ticket_entregue?: boolean;
                  status_ticket?: number;
                }
              ) => item.ticket_entregue || item.status_ticket === 3
            );
            statusMap[pedido.id] = todosEntregues;
          } else {
            statusMap[pedido.id] = false;
          }
        } catch {
          statusMap[pedido.id] = false;
        }
      } else {
        statusMap[pedido.id] = false;
      }
    }

    if (isMounted.current) {
      setTicketsStatus((prev) => ({ ...prev, ...statusMap }));
    }
  };

  const loadPedidos = useCallback(
    async (isRefreshing = false) => {
      try {
        if (isRefreshing) {
          setRefreshing(true);
        } else if (!isInitialLoad.current) {
          setLoading(true);
        }

        const filtrosComPaginacao: PedidosFilters = {
          ...filters,
          page: 1,
          per_page: 20,
        };

        const response: PedidosListResponse =
          await PedidosAPI.listarPedidos(filtrosComPaginacao);

        if (response.success && isMounted.current) {
          const pedidosValidados = response.pedidos.map((pedido) => ({
            ...pedido,
            solicitante: pedido.solicitante || { id: 0, nome: "N/A" },
            restaurante: pedido.restaurante || { id: 0, nome: "N/A" },
            estabelecimento: pedido.estabelecimento || { id: 0, nome: "N/A" },
          }));

          setPedidos(pedidosValidados);
          setTotalCount(response.pagination.total);
          setHasMore(
            response.pagination.current_page < response.pagination.last_page
          );
          setCurrentPage(1);

          const pedidosEntregues = pedidosValidados.filter(
            (p) => p.status === 5
          );
          if (pedidosEntregues.length > 0) {
            checkTicketsStatus(pedidosEntregues);
          }
        }
      } catch (error) {
        if (isMounted.current) {
          console.error("Erro ao carregar pedidos:", error);
          showErrorToast("Erro ao carregar pedidos");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
          isInitialLoad.current = false;
        }
      }
    },
    [filters]
  );

  const loadMorePedidos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const filtrosComPaginacao: PedidosFilters = {
        ...filters,
        page: currentPage + 1,
        per_page: 20,
      };

      const response: PedidosListResponse =
        await PedidosAPI.listarPedidos(filtrosComPaginacao);

      if (response.success && isMounted.current) {
        const pedidosValidados = response.pedidos.map((pedido) => ({
          ...pedido,
          solicitante: pedido.solicitante || { id: 0, nome: "N/A" },
          restaurante: pedido.restaurante || { id: 0, nome: "N/A" },
          estabelecimento: pedido.estabelecimento || { id: 0, nome: "N/A" },
        }));

        setPedidos((prev) => [...prev, ...pedidosValidados]);
        setHasMore(
          response.pagination.current_page < response.pagination.last_page
        );
        setCurrentPage(currentPage + 1);

        const pedidosEntregues = pedidosValidados.filter((p) => p.status === 5);
        if (pedidosEntregues.length > 0) {
          checkTicketsStatus(pedidosEntregues);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        showErrorToast("Erro ao carregar mais pedidos");
      }
    } finally {
      if (isMounted.current) {
        setLoadingMore(false);
      }
    }
  }, [filters, currentPage, hasMore, loadingMore]);

  useEffect(() => {
    loadPedidos();
  }, []);

  useEffect(() => {
    if (!isInitialLoad.current) {
      const timer = setTimeout(() => {
        loadPedidos();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters({
      ...filters,
      codigo_pedido: value?.trim() || undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    let newFilters = { ...filters };

    if (status === "today") {
      const today = new Date().toISOString().split("T")[0];
      newFilters = {
        ...newFilters,
        data_inicio: today,
        data_fim: today,
        status: undefined,
      };
    } else if (status === "all") {
      newFilters = {
        status: undefined,
        data_inicio: undefined,
        data_fim: undefined,
        codigo_pedido: searchTerm?.trim() || undefined,
      };
    } else {
      newFilters = {
        ...newFilters,
        status: parseInt(status),
        data_inicio: undefined,
        data_fim: undefined,
      };
    }

    setFilters(newFilters);
  };

  const handleViewDetails = (pedido: PedidoSimplificado) => {
    navigation.navigate("PedidoDetalhes", { pedidoId: pedido.id });
  };

  const handleCreateNew = () => {
    navigation.navigate("CriarPedido");
  };

  const handleAccept = async (id: number) => {
    Alert.alert(
      "Aceitar Pedido",
      "Deseja aceitar este pedido e iniciar o preparo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceitar",
          onPress: async () => {
            try {
              setLoadingActions((prev) => ({ ...prev, [id]: "accepting" }));
              const response = await PedidosAPI.aceitarPedido(id);

              if (response.success) {
                showSuccessToast("Pedido aceito e em preparo!");
                await loadPedidos(true);
              }
            } catch (error: any) {
              showErrorToast(error.message || "Erro ao aceitar pedido");
            } finally {
              setLoadingActions((prev) => ({ ...prev, [id]: "" }));
            }
          },
        },
      ]
    );
  };

  const handleMarkReady = async (id: number) => {
    Alert.alert(
      "Marcar como Pronto",
      "Confirma que o pedido está pronto para retirada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoadingActions((prev) => ({ ...prev, [id]: "ready" }));
              const response = await PedidosAPI.marcarPronto(id);

              if (response.success) {
                showSuccessToast("Pedido marcado como pronto!");
                await loadPedidos(true);
              }
            } catch (error: any) {
              showErrorToast(error.message || "Erro ao marcar como pronto");
            } finally {
              setLoadingActions((prev) => ({ ...prev, [id]: "" }));
            }
          },
        },
      ]
    );
  };

  const handleShowQRCode = (pedido: PedidoSimplificado) => {
    navigation.navigate("QRCode", { pedido });
  };

  const handleScanQRCode = (pedido: PedidoSimplificado) => {
    navigation.navigate("QRScanner", { pedido });
  };

  const handleReject = (pedido: PedidoSimplificado) => {
    navigation.navigate("RecusarPedido", { pedido });
  };

  const handleCancel = (pedido: PedidoSimplificado) => {
    navigation.navigate("CancelarPedido", { pedido });
  };

  const handleAddItems = (pedido: PedidoSimplificado) => {
    navigation.navigate("AdicionarItens", { pedidoId: pedido.id });
  };

  const handleEntregarItens = (pedido: PedidoSimplificado) => {
    navigation.navigate("EntregarItens", { pedidoId: pedido.id });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    if (tab === "home") {
      navigation.navigate("Home");
    }
  };

  const renderPedido = ({
    item,
    index,
  }: {
    item: PedidoSimplificado;
    index: number;
  }) => (
    <PedidoCard
      pedido={item}
      index={index}
      userType={userType}
      loadingAction={loadingActions[item.id] || ""}
      allTicketsDelivered={ticketsStatus[item.id] || false}
      onViewDetails={() => handleViewDetails(item)}
      onCancel={() => handleCancel(item)}
      onAddItems={() => handleAddItems(item)}
      onAccept={() => handleAccept(item.id)}
      onReject={() => handleReject(item)}
      onMarkReady={() => handleMarkReady(item.id)}
      onShowQRCode={() => handleShowQRCode(item)}
      onScanQRCode={() => handleScanQRCode(item)}
      onEntregarItens={() => handleEntregarItens(item)}
    />
  );

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.muted.light} />
        <Text style={styles.emptyTitle}>
          {isEstabelecimento
            ? "Nenhum pedido criado"
            : "Nenhum pedido recebido"}
        </Text>
        <Text style={styles.emptyDescription}>
          {isEstabelecimento
            ? "Comece criando seu primeiro pedido de refeições"
            : "Aguarde pedidos das garagens chegarem"}
        </Text>
        {isEstabelecimento && (
          <TouchableOpacity
            style={styles.createButtonEmpty}
            onPress={handleCreateNew}
          >
            <Ionicons name="add" size={20} color={colors.background.light} />
            <Text style={styles.createButtonText}>Criar Primeiro Pedido</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderHeader = () => {
    const filters_tabs = [
      { value: "all", label: "Todos" },
      { value: "today", label: "Hoje" },
    ];

    if (isEstabelecimento) {
      filters_tabs.push(
        { value: "1", label: "Pendentes" },
        { value: "4", label: "Prontos" },
        { value: "5", label: "Entregues" }
      );
    } else if (isRestaurante) {
      filters_tabs.push(
        { value: "1", label: "Pendentes" },
        { value: "2", label: "Aceitos" },
        { value: "3", label: "Em Preparo" },
        { value: "4", label: "Prontos" },
        { value: "5", label: "Entregues" }
      );
    }

    return (
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.muted.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pedido..."
            placeholderTextColor={colors.muted.light}
            value={searchTerm}
            onChangeText={handleSearchChange}
          />
        </View>

        <View style={styles.filterTabsContainer}>
          {filters_tabs.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterTab,
                selectedStatus === filter.value && styles.filterTabActive,
              ]}
              onPress={() => handleStatusChange(filter.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedStatus === filter.value && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.countText}>
          {pedidos.length} de {totalCount} pedidos
        </Text>
      </View>
    );
  };

  if (loading && pedidos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="receipt" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Pedidos</Text>
            <Text style={styles.subtitle}>
              {isEstabelecimento ? "Estabelecimento" : "Restaurante"}
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="sunny-outline"
              size={24}
              color={colors.text.light}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.text.light}
            />
          </TouchableOpacity>
          {isEstabelecimento && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateNew}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => `${item.id}-${item.codigo_pedido}`}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          pedidos.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPedidos(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMorePedidos}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: colors.background.light,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.light,
  },
  filterTabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.border.light,
  },
  filterTabActive: {
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.light,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  countText: {
    fontSize: 12,
    color: colors.muted.light,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.light,
    marginTop: 24,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.muted.light,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  createButtonEmpty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.text.light,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 32,
    gap: 8,
  },
  createButtonText: {
    color: colors.background.light,
    fontSize: 15,
    fontWeight: "600",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
