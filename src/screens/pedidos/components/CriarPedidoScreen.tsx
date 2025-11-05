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

interface Restaurante {
  id: number;
  nome: string;
  logradouro?: string;
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
  const [showRestauranteModal, setShowRestauranteModal] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tickets, setTickets] = useState<string[]>([]);
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
      // Fallback para dados mock em caso de erro
      setRestaurantes([]);
    } finally {
      setLoadingRestaurantes(false);
    }
  };

  const handleAddTicket = () => {
    const trimmedTicket = ticketNumber.trim();

    if (!trimmedTicket) {
      showErrorToast("Digite o número do ticket");
      return;
    }

    if (!selectedRestaurante) {
      showErrorToast("Selecione um restaurante primeiro");
      return;
    }

    if (tickets.includes(trimmedTicket)) {
      showErrorToast("Este ticket já foi adicionado");
      return;
    }

    setTickets([...tickets, trimmedTicket]);
    setTicketNumber("");
  };

  const handleRemoveTicket = (ticket: string) => {
    setTickets(tickets.filter((t) => t !== ticket));
  };

  const handleCreatePedido = async () => {
    if (!selectedRestaurante) {
      showErrorToast("Selecione um restaurante");
      return;
    }

    if (tickets.length === 0) {
      showErrorToast("Adicione pelo menos um ticket");
      return;
    }

    Alert.alert(
      "Criar Pedido",
      `Criar pedido com ${tickets.length} ticket(s) para ${selectedRestaurante.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar",
          onPress: async () => {
            try {
              setCreating(true);

              const response = await PedidosAPI.criarPedido({
                id_restaurante: selectedRestaurante.id,
                tickets: tickets,
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
                Nenhum restaurante disponível
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
            Adicione os tickets individualmente para criar o pedido.
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

        {/* Add Tickets Section */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Adicionar Tickets <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.ticketInputContainer}>
            <TextInput
              style={styles.ticketInput}
              placeholder="Digite o número do ticket"
              placeholderTextColor={colors.muted.light}
              value={ticketNumber}
              onChangeText={setTicketNumber}
              keyboardType="default"
              editable={!!selectedRestaurante}
              onSubmitEditing={handleAddTicket}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addTicketButton,
                !selectedRestaurante && styles.addTicketButtonDisabled,
              ]}
              onPress={handleAddTicket}
              disabled={!selectedRestaurante}
            >
              <Ionicons name="add" size={24} color={colors.background.light} />
            </TouchableOpacity>
          </View>

          {!selectedRestaurante && (
            <Text style={styles.helperText}>
              Selecione um restaurante para adicionar tickets
            </Text>
          )}

          {/* Tickets List */}
          {tickets.length > 0 && (
            <View style={styles.ticketsList}>
              {tickets.map((ticket, index) => (
                <View key={index} style={styles.ticketChip}>
                  <Text style={styles.ticketChipText}>#{ticket}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTicket(ticket)}
                    style={styles.ticketChipRemove}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.text.light}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {tickets.length > 0 && (
            <Text style={styles.ticketsCount}>
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}{" "}
              adicionado{tickets.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.label}>Observações Gerais</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Observações gerais sobre o pedido... (opcional)"
            placeholderTextColor={colors.muted.light}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.charCount}>
            {observacoes.length}/300 caracteres
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
            (creating || !selectedRestaurante || tickets.length === 0) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreatePedido}
          disabled={creating || !selectedRestaurante || tickets.length === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.createButtonText}>Criar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderRestauranteModal()}
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
    backgroundColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.muted.light,
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
  selectButtonText: {
    fontSize: 14,
    color: colors.text.light,
  },
  selectButtonPlaceholder: {
    color: colors.muted.light,
  },
  ticketInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  ticketInput: {
    flex: 1,
    backgroundColor: colors.card.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text.light,
  },
  addTicketButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.muted.light,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addTicketButtonDisabled: {
    opacity: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 8,
  },
  ticketsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  ticketChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    gap: 8,
  },
  ticketChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  ticketChipRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  ticketsCount: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 8,
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
    backgroundColor: colors.muted.light,
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
    color: colors.text.light,
  },
  modalItemTextActive: {
    fontWeight: "600",
    color: colors.primary,
  },
  modalItemSubtext: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 4,
  },
});
