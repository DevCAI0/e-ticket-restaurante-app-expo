import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Pedido, PedidoItem, TIPOS_REFEICAO } from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { colors } from "../../constants/colors";

interface PedidoDetalhesScreenProps {
  route: {
    params: {
      pedidoId: number;
    };
  };
  navigation: any;
}

export function PedidoDetalhesScreen({
  route,
  navigation,
}: PedidoDetalhesScreenProps) {
  const { pedidoId } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState<number | null>(null);

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
      showErrorToast("Erro ao carregar detalhes do pedido");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    Alert.alert(
      "Remover item",
      "Tem certeza que deseja remover este item do pedido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => confirmRemoveItem(itemId),
        },
      ]
    );
  };

  const confirmRemoveItem = async (itemId: number) => {
    try {
      setRemovingItem(itemId);
      const response = await PedidosAPI.removerItem(pedidoId, itemId);
      if (response.success) {
        showSuccessToast("Item removido com sucesso");
        loadPedido();
      }
    } catch (error) {
      showErrorToast("Erro ao remover item");
    } finally {
      setRemovingItem(null);
    }
  };

  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          color: colors.yellow[500],
          label: "Pendente",
          icon: "time-outline",
        };
      case 3:
        return {
          color: colors.purple[500],
          label: "Em Preparo",
          icon: "restaurant-outline",
        };
      case 4:
        return {
          color: colors.orange[500],
          label: "Pronto",
          icon: "checkmark-circle-outline",
        };
      case 5:
        return {
          color: colors.green[500],
          label: "Entregue",
          icon: "checkmark-done-outline",
        };
      case 6:
        return {
          color: colors.red[500],
          label: "Recusado",
          icon: "close-circle-outline",
        };
      case 7:
        return {
          color: colors.gray[500],
          label: "Cancelado",
          icon: "ban-outline",
        };
      default:
        return {
          color: colors.gray[500],
          label: "Indefinido",
          icon: "alert-circle-outline",
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.red[500]}
          />
          <Text style={styles.errorText}>Pedido não encontrado</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(pedido.status);
  const canRemoveItems = pedido.status === 1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Pedido #{pedido.codigo_pedido}</Text>
          <Text style={styles.subtitle}>Detalhes completos</Text>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons
            name={statusConfig.icon}
            size={16}
            color={statusConfig.color}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="restaurant" size={20} color={colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Restaurante</Text>
                <Text style={styles.infoValue}>{pedido.restaurante.nome}</Text>
                {pedido.restaurante.logradouro && (
                  <Text style={styles.infoSubvalue}>
                    {pedido.restaurante.logradouro}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color={colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estabelecimento</Text>
                <Text style={styles.infoValue}>
                  {pedido.estabelecimento.nome}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Solicitante</Text>
                <Text style={styles.infoValue}>{pedido.solicitante.nome}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data do Pedido</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(pedido.data_pedido)}
                </Text>
              </View>
            </View>
          </View>

          {pedido.observacoes && (
            <View style={styles.observationsCard}>
              <Text style={styles.observationsLabel}>Observações</Text>
              <Text style={styles.observationsText}>{pedido.observacoes}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {(pedido.data_aceito ||
          pedido.data_pronto ||
          pedido.data_entregue ||
          pedido.data_recusado ||
          pedido.data_cancelado) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline do Pedido</Text>

            <View style={styles.timelineCard}>
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.blue[500] },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Pedido Criado</Text>
                  <Text style={styles.timelineTime}>
                    {formatDateTime(pedido.data_pedido)}
                  </Text>
                </View>
              </View>

              {pedido.data_aceito && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.green[500] },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      Aceito pelo Restaurante
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_aceito)}
                    </Text>
                    {pedido.usuarioAceito && (
                      <Text style={styles.timelineUser}>
                        Por: {pedido.usuarioAceito.nome}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {pedido.data_pronto && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.orange[500] },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Pronto</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_pronto)}
                    </Text>
                    {pedido.usuarioPronto && (
                      <Text style={styles.timelineUser}>
                        Por: {pedido.usuarioPronto.nome}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {pedido.data_entregue && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.green[600] },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Entregue</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_entregue)}
                    </Text>
                    {pedido.usuarioEntregue && (
                      <Text style={styles.timelineUser}>
                        Por: {pedido.usuarioEntregue.nome}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {pedido.data_recusado && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.red[500] },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Recusado</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_recusado)}
                    </Text>
                    {pedido.usuarioRecusado && (
                      <Text style={styles.timelineUser}>
                        Por: {pedido.usuarioRecusado.nome}
                      </Text>
                    )}
                    {pedido.motivo_recusa && (
                      <Text style={styles.timelineReason}>
                        Motivo: {pedido.motivo_recusa}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {pedido.data_cancelado && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.gray[500] },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Cancelado</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_cancelado)}
                    </Text>
                    {pedido.usuarioCancelado && (
                      <Text style={styles.timelineUser}>
                        Por: {pedido.usuarioCancelado.nome}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Itens do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Itens do Pedido ({pedido.itensPedido.length})
          </Text>

          {pedido.itensPedido.map((item: PedidoItem) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemTicket}>#{item.numero_ticket}</Text>
                  <Text style={styles.itemType}>
                    {item.tipo_ticket === "avulso" ? "Avulso" : "Normal"}
                  </Text>
                </View>
                {canRemoveItems && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                    disabled={removingItem === item.id}
                  >
                    {removingItem === item.id ? (
                      <ActivityIndicator size="small" color={colors.red[600]} />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.red[600]}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Ionicons name="person" size={16} color={colors.gray[600]} />
                <Text style={styles.itemName}>{item.nome_funcionario}</Text>
              </View>

              <View style={styles.itemInfo}>
                <Ionicons
                  name="restaurant"
                  size={16}
                  color={colors.gray[600]}
                />
                <Text style={styles.itemMeal}>
                  {TIPOS_REFEICAO[
                    item.id_tipo_refeicao as keyof typeof TIPOS_REFEICAO
                  ] || `Tipo ${item.id_tipo_refeicao}`}
                </Text>
              </View>
            </View>
          ))}

          {pedido.itensPedido.length === 0 && (
            <View style={styles.emptyItems}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={colors.gray[400]}
              />
              <Text style={styles.emptyItemsText}>Nenhum item no pedido</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[900],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[900],
  },
  infoSubvalue: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  observationsCard: {
    marginTop: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  observationsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: 6,
  },
  observationsText: {
    fontSize: 14,
    color: colors.gray[900],
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.gray[600],
  },
  timelineUser: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  timelineReason: {
    fontSize: 12,
    color: colors.red[600],
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemTicket: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[900],
  },
  itemType: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[900],
  },
  itemMeal: {
    fontSize: 14,
    color: colors.gray[700],
  },
  emptyItems: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyItemsText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
