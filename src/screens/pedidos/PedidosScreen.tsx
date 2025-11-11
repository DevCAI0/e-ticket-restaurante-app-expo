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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { PedidosHeader } from "./components/PedidosHeader";
import { colors } from "../../constants/colors";
import { BottomNav } from "../../components/common/BottomNav";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";
import { RootStackParamList } from "../../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function PedidosScreen() {
  const navigation = useNavigation<NavigationProp>();
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
    console.log("📦 [PEDIDOS] Mudando para tab:", tab);
    setActiveTab(tab);

    if (tab === "home") {
      navigation.navigate("Home");
    } else if (tab === "ajustes") {
      navigation.navigate("Ajustes");
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

      <PedidosHeader
        isEstabelecimento={isEstabelecimento}
        isRestaurante={isRestaurante}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        totalCount={totalCount}
        pedidos={pedidos}
        onCreateNew={handleCreateNew}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => `${item.id}-${item.codigo_pedido}`}
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
