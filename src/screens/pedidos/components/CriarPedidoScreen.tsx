// src/screens/pedidos/components/CriarPedidoScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { showSuccessToast, showErrorToast } from "../../../lib/toast";
import { useAuth } from "../../../hooks/useAuth";
import { PedidosAPI } from "../../../api/pedidos";

interface CriarPedidoScreenProps {
  navigation: any;
  route?: any;
}

interface TipoRefeicaoDisponivel {
  id: number;
  nome: string;
  valor: number;
  valor_formatado: string;
  quota_total: number;
  quota_utilizada: number;
  quota_disponivel: number;
}

interface Restaurante {
  id: number;
  nome: string;
  logradouro?: string;
  tem_configuracao: boolean;
  tipos_refeicao_disponiveis: TipoRefeicaoDisponivel[];
}

export function CriarPedidoScreen({
  navigation,
  route,
}: CriarPedidoScreenProps) {
  const { user } = useAuth();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loadingRestaurantes, setLoadingRestaurantes] = useState(true);
  const [selectedRestaurante, setSelectedRestaurante] =
    useState<Restaurante | null>(null);
  const [selectedTipoRefeicao, setSelectedTipoRefeicao] =
    useState<TipoRefeicaoDisponivel | null>(null);

  // Modals
  const [showRestauranteModal, setShowRestauranteModal] = useState(false);
  const [showTipoRefeicaoModal, setShowTipoRefeicaoModal] = useState(false);

  // Quantidades
  const [quantidadeNormal, setQuantidadeNormal] = useState("");
  const [quantidadeAvulsa, setQuantidadeAvulsa] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRestaurantes();
  }, []);

  const loadRestaurantes = async () => {
    try {
      setLoadingRestaurantes(true);
      const response = await PedidosAPI.listarRestaurantesDisponiveis();

      if (response.success && response.data?.restaurantes) {
        setRestaurantes(response.data.restaurantes);
      } else {
        throw new Error("Nenhum restaurante disponível");
      }
    } catch (error: any) {
      console.error("Erro ao carregar restaurantes:", error);
      showErrorToast(error.message || "Erro ao carregar restaurantes");
      setRestaurantes([]);
    } finally {
      setLoadingRestaurantes(false);
    }
  };

  const getQuantidadeTotal = () => {
    const normal = parseInt(quantidadeNormal) || 0;
    const avulsa = parseInt(quantidadeAvulsa) || 0;
    return normal + avulsa;
  };

  const getValorTotal = () => {
    if (!selectedTipoRefeicao) return 0;
    return getQuantidadeTotal() * selectedTipoRefeicao.valor;
  };

  const getValorTotalFormatado = () => {
    const valor = getValorTotal();
    return `R$ ${(valor / 100).toFixed(2).replace(".", ",")}`;
  };

  const handleCreatePedido = async () => {
    if (!selectedRestaurante) {
      showErrorToast("Selecione um restaurante");
      return;
    }

    if (!selectedTipoRefeicao) {
      showErrorToast("Selecione o tipo de refeição");
      return;
    }

    const quantTotal = getQuantidadeTotal();

    if (quantTotal === 0) {
      showErrorToast("Adicione pelo menos 1 ticket (normal ou avulso)");
      return;
    }

    if (quantTotal > selectedTipoRefeicao.quota_disponivel) {
      showErrorToast(
        `Quantidade excede a quota disponível (${selectedTipoRefeicao.quota_disponivel} restantes)`
      );
      return;
    }

    const normal = parseInt(quantidadeNormal) || 0;
    const avulsa = parseInt(quantidadeAvulsa) || 0;

    Alert.alert(
      "Criar Pedido",
      `Criar pedido de ${quantTotal} ticket(s) para ${selectedRestaurante.nome}?\n\n` +
        `• Normal: ${normal}\n` +
        `• Avulso: ${avulsa}\n` +
        `• Tipo: ${selectedTipoRefeicao.nome}\n` +
        `• Valor Total: ${getValorTotalFormatado()}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar",
          onPress: async () => {
            try {
              setCreating(true);

              const response = await PedidosAPI.criarPedido({
                id_restaurante: selectedRestaurante.id,
                id_tipo_refeicao: selectedTipoRefeicao.id,
                quantidade_normal: normal,
                quantidade_avulsa: avulsa,
                observacoes: observacoes.trim() || undefined,
              });

              if (response.success) {
                showSuccessToast("Pedido criado com sucesso!");
                navigation.goBack();
              } else {
                throw new Error(response.message || "Erro ao criar pedido");
              }
            } catch (error: any) {
              console.error("Erro ao criar pedido:", error);
              showErrorToast(error.message || "Erro ao criar pedido");
            } finally {
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  const renderRestauranteModal = () => (
    <Modal
      visible={showRestauranteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRestauranteModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowRestauranteModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Restaurante</Text>
            <TouchableOpacity
              onPress={() => setShowRestauranteModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.light} />
            </TouchableOpacity>
          </View>

          {loadingRestaurantes ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : restaurantes.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={colors.muted.light}
              />
              <Text style={styles.modalEmptyText}>
                Nenhum restaurante disponível com quotas ativas
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalList}>
              {restaurantes.map((restaurante) => (
                <TouchableOpacity
                  key={restaurante.id}
                  style={[
                    styles.modalItem,
                    selectedRestaurante?.id === restaurante.id &&
                      styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedRestaurante(restaurante);
                    setSelectedTipoRefeicao(null); // Reset tipo refeição
                    setShowRestauranteModal(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedRestaurante?.id === restaurante.id &&
                          styles.modalItemTextActive,
                      ]}
                    >
                      {restaurante.nome}
                    </Text>
                    {restaurante.logradouro && (
                      <Text style={styles.modalItemSubtext}>
                        {restaurante.logradouro}
                      </Text>
                    )}
                    <Text style={styles.modalItemInfo}>
                      {restaurante.tipos_refeicao_disponiveis.length} tipo(s) de
                      refeição
                    </Text>
                  </View>
                  {selectedRestaurante?.id === restaurante.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTipoRefeicaoModal = () => {
    if (!selectedRestaurante) return null;

    return (
      <Modal
        visible={showTipoRefeicaoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTipoRefeicaoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTipoRefeicaoModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Refeição</Text>
              <TouchableOpacity
                onPress={() => setShowTipoRefeicaoModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text.light} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {selectedRestaurante.tipos_refeicao_disponiveis.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.modalItem,
                    selectedTipoRefeicao?.id === tipo.id &&
                      styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedTipoRefeicao(tipo);
                    setShowTipoRefeicaoModal(false);
                  }}
                  disabled={tipo.quota_disponivel === 0}
                >
                  <View style={styles.modalItemContent}>
                    <View style={styles.tipoRefeicaoHeader}>
                      <Text
                        style={[
                          styles.modalItemText,
                          selectedTipoRefeicao?.id === tipo.id &&
                            styles.modalItemTextActive,
                          tipo.quota_disponivel === 0 && styles.disabledText,
                        ]}
                      >
                        {tipo.nome}
                      </Text>
                      <Text style={styles.valorBadge}>
                        {tipo.valor_formatado}
                      </Text>
                    </View>

                    <View style={styles.quotaInfo}>
                      <View style={styles.quotaRow}>
                        <Text style={styles.quotaLabel}>Disponível:</Text>
                        <Text
                          style={[
                            styles.quotaValue,
                            tipo.quota_disponivel === 0 && styles.quotaEsgotada,
                          ]}
                        >
                          {tipo.quota_disponivel} de {tipo.quota_total}
                        </Text>
                      </View>

                      {/* Barra de progresso */}
                      <View style={styles.quotaBar}>
                        <View
                          style={[
                            styles.quotaBarFill,
                            {
                              width: `${(tipo.quota_utilizada / tipo.quota_total) * 100}%`,
                              backgroundColor:
                                tipo.quota_disponivel === 0
                                  ? colors.destructive.light
                                  : tipo.quota_disponivel <= 5
                                    ? colors.warning
                                    : colors.success,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {tipo.quota_disponivel === 0 && (
                      <Text style={styles.esgotadoText}>Quota esgotada</Text>
                    )}
                  </View>

                  {selectedTipoRefeicao?.id === tipo.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Novo Pedido</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Estabelecimento Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {user?.nome_estabelecimento || "ESTABELECIMENTO"}
          </Text>
          <Text style={styles.infoDescription}>
            Selecione o restaurante, tipo de refeição e quantidade de tickets
            para criar o pedido.
          </Text>
        </View>

        {/* Restaurante Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Restaurante <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowRestauranteModal(true)}
            disabled={loadingRestaurantes}
          >
            {loadingRestaurantes ? (
              <ActivityIndicator size="small" color={colors.muted.light} />
            ) : (
              <>
                <Text
                  style={[
                    styles.selectButtonText,
                    !selectedRestaurante && styles.selectButtonPlaceholder,
                  ]}
                >
                  {selectedRestaurante?.nome || "Selecione o restaurante"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.muted.light}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tipo de Refeição Selection */}
        {selectedRestaurante && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Tipo de Refeição <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowTipoRefeicaoModal(true)}
            >
              <View style={styles.selectButtonContent}>
                <Text
                  style={[
                    styles.selectButtonText,
                    !selectedTipoRefeicao && styles.selectButtonPlaceholder,
                  ]}
                >
                  {selectedTipoRefeicao?.nome || "Selecione o tipo"}
                </Text>
                {selectedTipoRefeicao && (
                  <View style={styles.quotaBadge}>
                    <Text style={styles.quotaBadgeText}>
                      {selectedTipoRefeicao.quota_disponivel} disponíveis
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.muted.light}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Quantidade Section */}
        {selectedTipoRefeicao && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Quantidade de Tickets <Text style={styles.required}>*</Text>
            </Text>

            {/* Tickets Normais */}
            <View style={styles.quantidadeCard}>
              <View style={styles.quantidadeHeader}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <Text style={styles.quantidadeTitle}>Tickets Normais</Text>
              </View>
              <Text style={styles.quantidadeDescription}>
                Tickets para funcionários cadastrados (reconhecimento facial)
              </Text>
              <TextInput
                style={styles.quantidadeInput}
                placeholder="0"
                placeholderTextColor={colors.muted.light}
                value={quantidadeNormal}
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9]/g, "");
                  setQuantidadeNormal(value);
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* Tickets Avulsos */}
            <View style={styles.quantidadeCard}>
              <View style={styles.quantidadeHeader}>
                <Ionicons name="people" size={20} color={colors.info} />
                <Text style={styles.quantidadeTitle}>Tickets Avulsos</Text>
              </View>
              <Text style={styles.quantidadeDescription}>
                Tickets para pessoas não cadastradas (CPF/Nome)
              </Text>
              <TextInput
                style={styles.quantidadeInput}
                placeholder="0"
                placeholderTextColor={colors.muted.light}
                value={quantidadeAvulsa}
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9]/g, "");
                  setQuantidadeAvulsa(value);
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* Resumo */}
            {getQuantidadeTotal() > 0 && (
              <View style={styles.resumoCard}>
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>Total de tickets:</Text>
                  <Text style={styles.resumoValue}>{getQuantidadeTotal()}</Text>
                </View>
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>Valor unitário:</Text>
                  <Text style={styles.resumoValue}>
                    {selectedTipoRefeicao.valor_formatado}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoTotalLabel}>Valor Total:</Text>
                  <Text style={styles.resumoTotalValue}>
                    {getValorTotalFormatado()}
                  </Text>
                </View>

                {/* Aviso de quota */}
                {getQuantidadeTotal() >
                  selectedTipoRefeicao.quota_disponivel && (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={16} color={colors.warning} />
                    <Text style={styles.warningText}>
                      Quantidade excede quota disponível (
                      {selectedTipoRefeicao.quota_disponivel})
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.label}>Observações Gerais</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Observações sobre o pedido... (opcional)"
            placeholderTextColor={colors.muted.light}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {observacoes.length}/500 caracteres
          </Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={creating}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            (creating ||
              !selectedRestaurante ||
              !selectedTipoRefeicao ||
              getQuantidadeTotal() === 0 ||
              getQuantidadeTotal() > selectedTipoRefeicao.quota_disponivel) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreatePedido}
          disabled={
            creating ||
            !selectedRestaurante ||
            !selectedTipoRefeicao ||
            getQuantidadeTotal() === 0 ||
            getQuantidadeTotal() > selectedTipoRefeicao.quota_disponivel
          }
        >
          {creating ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.createButtonText}>Criar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderRestauranteModal()}
      {renderTipoRefeicaoModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.primary + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.text.light,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 8,
  },
  required: {
    color: colors.destructive.light,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  selectButtonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectButtonText: {
    fontSize: 14,
    color: colors.text.light,
  },
  selectButtonPlaceholder: {
    color: colors.muted.light,
  },
  quotaBadge: {
    backgroundColor: colors.success + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quotaBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  quantidadeCard: {
    backgroundColor: colors.card.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quantidadeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  quantidadeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  quantidadeDescription: {
    fontSize: 12,
    color: colors.muted.light,
    marginBottom: 12,
    lineHeight: 18,
  },
  quantidadeInput: {
    backgroundColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    textAlign: "center",
  },
  resumoCard: {
    backgroundColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  resumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: colors.muted.light,
  },
  resumoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  resumoTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
  },
  resumoTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 8,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warning + "15",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
  },
  textArea: {
    backgroundColor: colors.card.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.light,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: colors.muted.light,
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: colors.card.light,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.border.light,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card.light,
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  modalEmpty: {
    padding: 40,
    alignItems: "center",
  },
  modalEmptyText: {
    fontSize: 14,
    color: colors.muted.light,
    marginTop: 12,
    textAlign: "center",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalItemActive: {
    backgroundColor: colors.primary + "10",
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  modalItemTextActive: {
    color: colors.primary,
  },
  modalItemSubtext: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 4,
  },
  modalItemInfo: {
    fontSize: 11,
    color: colors.muted.light,
    marginTop: 6,
  },
  tipoRefeicaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  valorBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  quotaInfo: {
    marginTop: 8,
  },
  quotaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quotaLabel: {
    fontSize: 12,
    color: colors.muted.light,
  },
  quotaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
  quotaEsgotada: {
    color: colors.destructive.light,
  },
  quotaBar: {
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: 3,
    overflow: "hidden",
  },
  quotaBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  esgotadoText: {
    fontSize: 11,
    color: colors.destructive.light,
    marginTop: 6,
    fontWeight: "600",
  },
  disabledText: {
    color: colors.muted.light,
  },
});
