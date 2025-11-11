// src/screens/pedidos/EntregarItensScreen.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pedido, PedidoItem } from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { colors } from "../../constants/colors";

interface RouteParams {
  pedidoId: number;
}

export function EntregarItensScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pedidoId } = route.params as RouteParams;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"normal" | "avulso">("normal");

  useEffect(() => {
    loadPedido();
  }, [pedidoId]);

  const loadPedido = async () => {
    try {
      setLoading(true);
      const response = await PedidosAPI.obterPedido(pedidoId);
      if (response.success) {
        setPedido(response.pedido);
      }
    } catch (error) {
      showErrorToast("Erro ao carregar pedido");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleScanFace = (item: PedidoItem) => {
    navigation.navigate("BiometricApproval", {
      mode: "pedido",
      pedidoId,
      itemId: item.id,
      onSuccess: () => {
        loadPedido();
        showSuccessToast("Item entregue com sucesso!");
      },
    });
  };

  // ✅ ATUALIZADO: Ao clicar no item, abre o scanner diretamente
  const handleSelectAvulsoItem = (item: PedidoItem) => {
    navigation.navigate("ScanTicketAvulso", {
      pedidoId,
      itemId: item.id,
      onSuccess: () => {
        // Recarregar pedido após consumo bem-sucedido
        loadPedido();
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return null;
  }

  const itensNormais = pedido.itensPedido.filter(
    (item) => item.tipo === "normal" && !item.entregue
  );
  const itensAvulsos = pedido.itensPedido.filter(
    (item) => item.tipo === "avulso" && !item.entregue
  );

  const itensAtivos = selectedTab === "normal" ? itensNormais : itensAvulsos;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Entregar Itens</Text>
          <Text style={styles.subtitle}>#{pedido.codigo_pedido}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "normal" && styles.tabActive]}
          onPress={() => setSelectedTab("normal")}
        >
          <Ionicons
            name="person"
            size={20}
            color={
              selectedTab === "normal" ? colors.primary : colors.muted.light
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "normal" && styles.tabTextActive,
            ]}
          >
            Normal ({itensNormais.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "avulso" && styles.tabActive]}
          onPress={() => setSelectedTab("avulso")}
        >
          <Ionicons
            name="people"
            size={20}
            color={
              selectedTab === "avulso" ? colors.primary : colors.muted.light
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "avulso" && styles.tabTextActive,
            ]}
          >
            Avulso ({itensAvulsos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {itensAtivos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done" size={64} color={colors.success} />
            <Text style={styles.emptyText}>
              Todos os tickets{" "}
              {selectedTab === "normal" ? "normais" : "avulsos"} foram
              entregues!
            </Text>
          </View>
        ) : selectedTab === "normal" ? (
          // Lista de items normais
          <View style={styles.itemsList}>
            <Text style={styles.sectionTitle}>
              Selecione um item para entregar via reconhecimento facial
            </Text>
            {itensNormais.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleScanFace(item)}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Ticket Normal</Text>
                    <Text style={styles.itemSubtitle}>
                      {pedido.tipo_refeicao}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemAction}>
                  <Ionicons name="scan" size={24} color={colors.primary} />
                  <Text style={styles.itemActionText}>Escanear Rosto</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Lista de itens avulsos - Clique direto abre o scanner
          <View style={styles.itemsList}>
            <Text style={styles.sectionTitle}>
              Toque em um item para escanear o ticket
            </Text>
            {itensAvulsos.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleSelectAvulsoItem(item)}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Ticket Avulso</Text>
                    <Text style={styles.itemSubtitle}>
                      {pedido.tipo_refeicao}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemAction}>
                  <Ionicons name="scan" size={24} color={colors.primary} />
                  <Text style={styles.itemActionText}>Escanear Ticket</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.card.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted.light,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    minHeight: 400,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    textAlign: "center",
  },
  itemsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  itemNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  itemNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 2,
  },
  itemAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.primary + "15",
    borderRadius: 8,
  },
  itemActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
