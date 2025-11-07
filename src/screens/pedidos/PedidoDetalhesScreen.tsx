// src/screens/pedidos/PedidoDetalhesScreen.tsx
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

  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          color: colors.warning,
          label: "Pendente",
          icon: "time-outline" as const,
        };
      case 2:
        return {
          color: colors.info,
          label: "Aceito",
          icon: "checkmark-outline" as const,
        };
      case 3:
        return {
          color: colors.info,
          label: "Em Preparo",
          icon: "restaurant-outline" as const,
        };
      case 4:
        return {
          color: colors.primary,
          label: "Pronto",
          icon: "checkmark-circle-outline" as const,
        };
      case 5:
        return {
          color: colors.success,
          label: "Entregue",
          icon: "checkmark-done-outline" as const,
        };
      case 6:
        return {
          color: colors.destructive.light,
          label: "Recusado",
          icon: "close-circle-outline" as const,
        };
      case 7:
        return {
          color: colors.muted.light,
          label: "Cancelado",
          icon: "ban-outline" as const,
        };
      default:
        return {
          color: colors.muted.light,
          label: "Indefinido",
          icon: "alert-circle-outline" as const,
        };
    }
  };

  const getStatusTicketBadge = (item: PedidoItem) => {
    if (item.entregue) {
      return {
        label: "Entregue",
        color: colors.success,
        bgColor: colors.success + "15",
      };
    }
    return {
      label: "Pendente",
      color: colors.warning,
      bgColor: colors.warning + "15",
    };
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return null;

    try {
      let date: Date;

      if (dateString.includes("/")) {
        const [datePart, timePart] = dateString.split(" ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute] = timePart ? timePart.split(":") : ["00", "00"];
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.warn("Data inválida:", dateString);
        return null;
      }

      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.destructive.light}
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

  const itensNormais = pedido.itensPedido.filter(
    (item) => item.tipo === "normal"
  );
  const itensAvulsos = pedido.itensPedido.filter(
    (item) => item.tipo === "avulso"
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="restaurant"
                size={20}
                color={colors.muted.light}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Restaurante</Text>
                <Text style={styles.infoValue}>
                  {pedido.restaurante?.nome || "N/A"}
                </Text>
                {pedido.restaurante?.logradouro && (
                  <Text style={styles.infoSubvalue}>
                    {pedido.restaurante.logradouro}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color={colors.muted.light} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estabelecimento</Text>
                <Text style={styles.infoValue}>
                  {pedido.estabelecimento?.nome || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.muted.light} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Solicitante</Text>
                <Text style={styles.infoValue}>
                  {pedido.solicitante || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons
                name="restaurant"
                size={20}
                color={colors.muted.light}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tipo de Refeição</Text>
                <Text style={styles.infoValue}>{pedido.tipo_refeicao}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.muted.light} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data do Pedido</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(pedido.data_pedido) || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color={colors.muted.light} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Valor Total</Text>
                <Text style={styles.infoValue}>
                  {pedido.valor_total_formatado}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tickets Normais</Text>
                <Text style={styles.summaryValue}>
                  {pedido.quantidade_normal}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tickets Avulsos</Text>
                <Text style={styles.summaryValue}>
                  {pedido.quantidade_avulsa}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Entregues</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {pedido.itens_entregues}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pendentes</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>
                  {pedido.itens_pendentes}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {(pedido.data_aceito || pedido.data_pronto || pedido.data_entregue) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline do Pedido</Text>

            <View style={styles.timelineCard}>
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: colors.info }]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Pedido Criado</Text>
                  <Text style={styles.timelineTime}>
                    {formatDateTime(pedido.data_pedido) || "N/A"}
                  </Text>
                </View>
              </View>

              {pedido.data_aceito && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.success },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      Aceito pelo Restaurante
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_aceito) || "N/A"}
                    </Text>
                  </View>
                </View>
              )}

              {pedido.data_pronto && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Pronto</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_pronto) || "N/A"}
                    </Text>
                  </View>
                </View>
              )}

              {pedido.data_entregue && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.success },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Pedido Entregue</Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(pedido.data_entregue) || "N/A"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {itensNormais.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tickets Normais ({itensNormais.length})
            </Text>
            <Text style={styles.sectionDescription}>
              Tickets para funcionários cadastrados (reconhecimento facial)
            </Text>

            {itensNormais.map((item: PedidoItem, index: number) => {
              const statusBadge = getStatusTicketBadge(item);
              const dataEntregaFormatada = formatDateTime(item.data_entrega);

              return (
                <View
                  key={`normal-${item.id || index}`}
                  style={styles.itemCard}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemHeaderLeft}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.itemNumber}>Item #{index + 1}</Text>
                    </View>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        { backgroundColor: statusBadge.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemStatusText,
                          { color: statusBadge.color },
                        ]}
                      >
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>

                  {item.entregue ? (
                    <>
                      <View style={styles.itemInfo}>
                        <Ionicons
                          name="person"
                          size={16}
                          color={colors.muted.light}
                        />
                        <Text style={styles.itemInfoText}>
                          {item.funcionario || "N/A"}
                        </Text>
                      </View>
                      {item.cpf && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="card"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>{item.cpf}</Text>
                        </View>
                      )}
                      {item.ticket_numero && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="ticket"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>
                            Ticket: {item.ticket_numero}
                          </Text>
                        </View>
                      )}
                      {dataEntregaFormatada && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="time"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>
                            {dataEntregaFormatada}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.itemPending}>
                      <Ionicons
                        name="hourglass-outline"
                        size={16}
                        color={colors.muted.light}
                      />
                      <Text style={styles.itemPendingText}>
                        Aguardando entrega ao funcionário
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {itensAvulsos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tickets Avulsos ({itensAvulsos.length})
            </Text>
            <Text style={styles.sectionDescription}>
              Tickets para pessoas não cadastradas
            </Text>

            {itensAvulsos.map((item: PedidoItem, index: number) => {
              const statusBadge = getStatusTicketBadge(item);
              const dataEntregaFormatada = formatDateTime(item.data_entrega);

              return (
                <View
                  key={`avulso-${item.id || index}`}
                  style={styles.itemCard}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemHeaderLeft}>
                      <Ionicons name="people" size={20} color={colors.info} />
                      <Text style={styles.itemNumber}>Item #{index + 1}</Text>
                    </View>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        { backgroundColor: statusBadge.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemStatusText,
                          { color: statusBadge.color },
                        ]}
                      >
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>

                  {item.entregue ? (
                    <>
                      <View style={styles.itemInfo}>
                        <Ionicons
                          name="person"
                          size={16}
                          color={colors.muted.light}
                        />
                        <Text style={styles.itemInfoText}>
                          {item.funcionario || "N/A"}
                        </Text>
                      </View>
                      {item.cpf && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="card"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>{item.cpf}</Text>
                        </View>
                      )}
                      {item.ticket_numero && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="ticket"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>
                            Ticket: {item.ticket_numero}
                          </Text>
                        </View>
                      )}
                      {dataEntregaFormatada && (
                        <View style={styles.itemInfo}>
                          <Ionicons
                            name="time"
                            size={16}
                            color={colors.muted.light}
                          />
                          <Text style={styles.itemInfoText}>
                            {dataEntregaFormatada}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.itemPending}>
                      <Ionicons
                        name="hourglass-outline"
                        size={16}
                        color={colors.muted.light}
                      />
                      <Text style={styles.itemPendingText}>
                        Aguardando entrega
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {pedido.itensPedido.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyItems}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={colors.muted.light}
              />
              <Text style={styles.emptyItemsText}>Nenhum item no pedido</Text>
            </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted.light,
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
    color: colors.text.light,
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
    marginLeft: 12,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.border.light,
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
    color: colors.text.light,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.muted.light,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
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
    color: colors.muted.light,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  infoSubvalue: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  observationsCard: {
    marginTop: 12,
    backgroundColor: colors.border.light,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  observationsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 6,
  },
  observationsText: {
    fontSize: 14,
    color: colors.text.light,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.muted.light,
    marginBottom: 6,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.light,
  },
  timelineCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
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
    color: colors.text.light,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.muted.light,
  },
  itemCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  itemStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  itemInfoText: {
    fontSize: 13,
    color: colors.text.light,
  },
  itemPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.border.light,
    borderRadius: 8,
  },
  itemPendingText: {
    fontSize: 13,
    color: colors.muted.light,
    fontStyle: "italic",
  },
  emptyItems: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyItemsText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted.light,
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.background.light,
    fontSize: 16,
    fontWeight: "600",
  },
});
