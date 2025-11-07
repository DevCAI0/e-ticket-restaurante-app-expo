// src/screens/pedidos/EntregarItensScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
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
  const [selectedItem, setSelectedItem] = useState<PedidoItem | null>(null);

  // Estados para formulário de entrega avulsa
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [cpfAvulso, setCpfAvulso] = useState("");
  const [observacao, setObservacao] = useState("");
  const [entregando, setEntregando] = useState(false);

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
    // Navegar para tela de reconhecimento facial em modo pedido
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

  const handleEntregarAvulso = async () => {
    if (!selectedItem) return;

    if (!nomeAvulso.trim()) {
      showErrorToast("Informe o nome da pessoa");
      return;
    }

    Alert.alert(
      "Confirmar Entrega",
      `Entregar ticket avulso para ${nomeAvulso}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setEntregando(true);
              const response = await PedidosAPI.entregarItemAvulso(
                pedidoId,
                selectedItem.id,
                {
                  nome: nomeAvulso,
                  cpf: cpfAvulso,
                  observacao,
                }
              );

              if (response.success) {
                showSuccessToast("Item entregue com sucesso!");
                setSelectedItem(null);
                setNomeAvulso("");
                setCpfAvulso("");
                setObservacao("");
                await loadPedido();
              }
            } catch (error: any) {
              showErrorToast(error.message || "Erro ao entregar item");
            } finally {
              setEntregando(false);
            }
          },
        },
      ]
    );
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
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
          onPress={() => {
            setSelectedTab("normal");
            setSelectedItem(null);
          }}
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
          onPress={() => {
            setSelectedTab("avulso");
            setSelectedItem(null);
          }}
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
          // Lista de itens avulsos
          <View style={styles.itemsList}>
            <Text style={styles.sectionTitle}>
              Selecione um item e preencha os dados
            </Text>
            {itensAvulsos.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  selectedItem?.id === item.id && styles.itemCardSelected,
                ]}
                onPress={() => setSelectedItem(item)}
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
                {selectedItem?.id === item.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.selectedBadgeText}>Selecionado</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Formulário de entrega avulsa */}
            {selectedItem && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Dados da Entrega</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome Completo *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o nome da pessoa"
                    placeholderTextColor={colors.muted.light}
                    value={nomeAvulso}
                    onChangeText={setNomeAvulso}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CPF (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor={colors.muted.light}
                    value={cpfAvulso}
                    onChangeText={(text) => setCpfAvulso(formatCPF(text))}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observação (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ex: Visitante, terceirizado..."
                    placeholderTextColor={colors.muted.light}
                    value={observacao}
                    onChangeText={setObservacao}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.entregarButton,
                    (!nomeAvulso.trim() || entregando) &&
                      styles.entregarButtonDisabled,
                  ]}
                  onPress={handleEntregarAvulso}
                  disabled={!nomeAvulso.trim() || entregando}
                >
                  {entregando ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.background.light}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.background.light}
                      />
                      <Text style={styles.entregarButtonText}>
                        Confirmar Entrega
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
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
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  formCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.light,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  entregarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  entregarButtonDisabled: {
    opacity: 0.5,
  },
  entregarButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
});
