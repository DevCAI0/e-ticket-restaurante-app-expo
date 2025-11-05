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
import {
  PedidoSimplificado,
  PedidosFilters,
  PedidosListResponse,
  PedidoItem,
} from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { useAuth } from "../../hooks/useAuth";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { PedidoCard } from "./components/PedidoCard";
import { PedidosHeader } from "./components/PedidosHeader";
import { colors } from "../../constants/colors";

interface PedidosScreenProps {
  navigation: any;
  route?: any;
}

export function PedidosScreen({ navigation, route }: PedidosScreenProps) {
  const { user } = useAuth();
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

  const userType = user?.tipo_usuario || "indefinido";
  const isEstabelecimento = userType === "estabelecimento";
  const isRestaurante = userType === "restaurante";

  // Atualizar quando retornar de outras telas
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!isInitialLoad.current) {
        loadPedidos(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

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
          setPedidos(response.pedidos);
          setTotalCount(response.pagination.total);
          setHasMore(
            response.pagination.current_page < response.pagination.last_page
          );
          setCurrentPage(1);

          // Verificar status dos tickets entregues
          const pedidosEntregues = response.pedidos.filter(
            (p) => p.status === 5
          );
          if (pedidosEntregues.length > 0) {
            checkTicketsStatus(pedidosEntregues);
          }
        }
      } catch (error) {
        if (isMounted.current) {
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
        setPedidos((prev) => [...prev, ...response.pedidos]);
        setHasMore(
          response.pagination.current_page < response.pagination.last_page
        );
        setCurrentPage(currentPage + 1);

        // Verificar status dos novos tickets entregues
        const pedidosEntregues = response.pedidos.filter((p) => p.status === 5);
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

  const handleDeliverToEmployee = (pedido: PedidoSimplificado) => {
    navigation.navigate("EntregarFuncionario", { pedido });
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
      onDeliverToEmployee={() => handleDeliverToEmployee(item)}
    />
  );

  const renderEmpty = () => {
    const hasFilters = Object.values(filters).some(
      (v) => v !== undefined && v !== null && v !== ""
    );

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={hasFilters ? "search-outline" : "receipt-outline"}
          size={64}
          color={colors.muted.light}
        />
        <Text style={styles.emptyTitle}>
          {hasFilters ? "Nenhum pedido encontrado" : "Nenhum pedido criado"}
        </Text>
        <Text style={styles.emptyDescription}>
          {hasFilters
            ? "Tente ajustar os filtros"
            : isEstabelecimento
              ? "Comece criando seu primeiro pedido"
              : "Aguarde pedidos chegarem"}
        </Text>
        {isEstabelecimento && !hasFilters && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
          >
            <Ionicons name="add" size={20} color={colors.background.light} />
            <Text style={styles.createButtonText}>Criar Pedido</Text>
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
        <Text style={styles.loadingMoreText}>Carregando mais pedidos...</Text>
      </View>
    );
  };

  if (loading && pedidos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted.light,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.light,
    marginTop: 16,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.muted.light,
    marginTop: 8,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: colors.background.light,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.muted.light,
  },
});
