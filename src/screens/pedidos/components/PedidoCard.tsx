import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PedidoSimplificado } from "../../../types/pedidos";
import { colors } from "../../../constants/colors";

interface PedidoCardProps {
  pedido: PedidoSimplificado;
  index: number;
  userType: string;
  loadingAction: string;
  allTicketsDelivered?: boolean;
  onViewDetails: () => void;
  onCancel: () => void;
  onAddItems: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMarkReady: () => void;
  onShowQRCode: () => void;
  onScanQRCode: () => void;
  onEntregarItens?: () => void;
}

export function PedidoCard({
  pedido,
  userType,
  loadingAction,
  allTicketsDelivered = false,
  onViewDetails,
  onCancel,
  onAddItems,
  onAccept,
  onReject,
  onMarkReady,
  onShowQRCode,
  onScanQRCode,
  onEntregarItens,
}: PedidoCardProps) {
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          color: colors.warning,
          bgColor: colors.warning + "15",
          textColor: colors.warning,
          icon: "time-outline" as const,
          label: "Pendente",
        };
      case 2:
        return {
          color: colors.info,
          bgColor: colors.info + "15",
          textColor: colors.info,
          icon: "checkmark-outline" as const,
          label: "Aceito",
        };
      case 3:
        return {
          color: colors.info,
          bgColor: colors.info + "15",
          textColor: colors.info,
          icon: "restaurant-outline" as const,
          label: "Em Preparo",
        };
      case 4:
        return {
          color: colors.primary,
          bgColor: colors.primary + "15",
          textColor: colors.primary,
          icon: "checkmark-circle-outline" as const,
          label: "Pronto",
        };
      case 5:
        return {
          color: colors.success,
          bgColor: colors.success + "15",
          textColor: colors.success,
          icon: "checkmark-done-outline" as const,
          label: "Entregue",
        };
      case 6:
        return {
          color: colors.destructive.light,
          bgColor: colors.destructive.light + "15",
          textColor: colors.destructive.light,
          icon: "close-circle-outline" as const,
          label: "Recusado",
        };
      case 7:
        return {
          color: colors.muted.light,
          bgColor: colors.border.light,
          textColor: colors.muted.light,
          icon: "ban-outline" as const,
          label: "Cancelado",
        };
      default:
        return {
          color: colors.muted.light,
          bgColor: colors.border.light,
          textColor: colors.muted.light,
          icon: "alert-circle-outline" as const,
          label: "Indefinido",
        };
    }
  };

  const statusConfig = getStatusConfig(pedido.status);

  const formatTime = (dateString: string) => {
    try {
      const [, timePart] = dateString.split(" ");
      if (timePart) return timePart;

      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // ✅ Extrair dados com verificações de segurança
  const nomeExibicao =
    userType === "estabelecimento"
      ? pedido.restaurante?.nome || "Restaurante"
      : pedido.estabelecimento?.nome || "Estabelecimento";

  const nomeSolicitante = pedido.solicitante?.nome || "Não informado";
  const totalItens = pedido.total_itens || 0;

  // ✅ CORREÇÃO: Extrair apenas o número do código do pedido
  const numeroPedido = pedido.codigo_pedido
    ? pedido.codigo_pedido.replace(/[^0-9]/g, "")
    : String(pedido.id || "N/A");

  const dataPedido = pedido.data_pedido || "";
  const observacoes = pedido.observacoes;

  const renderActions = () => {
    const actions = [];

    // ========== ESTABELECIMENTO ==========

    // Status 1 - Pendente (Estabelecimento)
    if (pedido.status === 1 && userType === "estabelecimento") {
      actions.push(
        <TouchableOpacity
          key="cancel"
          style={[styles.actionButton, styles.dangerButton]}
          onPress={onCancel}
          disabled={loadingAction === "canceling"}
        >
          {loadingAction === "canceling" ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.background.light}
              />
              <Text style={styles.dangerButtonText}>Cancelar</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Status 4 - Pronto (Estabelecimento pode ver QR Code)
    if (pedido.status === 4 && userType === "estabelecimento") {
      actions.push(
        <TouchableOpacity
          key="qr"
          style={[styles.actionButton, styles.successButton]}
          onPress={onShowQRCode}
        >
          <Ionicons name="qr-code" size={16} color={colors.background.light} />
          <Text style={styles.successButtonText}>QR Code</Text>
        </TouchableOpacity>
      );
    }

    // Status 5 - Entregue (Estabelecimento pode entregar itens individuais)
    if (
      pedido.status === 5 &&
      userType === "estabelecimento" &&
      onEntregarItens
    ) {
      if (!allTicketsDelivered) {
        actions.push(
          <TouchableOpacity
            key="entregar"
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onEntregarItens}
          >
            <Ionicons
              name="person-add"
              size={16}
              color={colors.background.light}
            />
            <Text style={styles.primaryButtonText}>
              Entregar ao Funcionário
            </Text>
          </TouchableOpacity>
        );
      }
    }

    // ========== RESTAURANTE ==========

    // Status 1 - Pendente (Restaurante pode aceitar/recusar)
    if (pedido.status === 1 && userType === "restaurante") {
      actions.push(
        <TouchableOpacity
          key="accept"
          style={[styles.actionButton, styles.successButton]}
          onPress={onAccept}
          disabled={loadingAction === "accepting"}
        >
          {loadingAction === "accepting" ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="checkmark"
                size={16}
                color={colors.background.light}
              />
              <Text style={styles.successButtonText}>Aceitar</Text>
            </>
          )}
        </TouchableOpacity>
      );

      actions.push(
        <TouchableOpacity
          key="reject"
          style={[styles.actionButton, styles.dangerButton]}
          onPress={onReject}
          disabled={loadingAction === "rejecting"}
        >
          {loadingAction === "rejecting" ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="close"
                size={16}
                color={colors.background.light}
              />
              <Text style={styles.dangerButtonText}>Recusar</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Status 2 - Aceito ou Status 3 - Em Preparo (Restaurante pode marcar como pronto)
    if (
      (pedido.status === 2 || pedido.status === 3) &&
      userType === "restaurante"
    ) {
      actions.push(
        <TouchableOpacity
          key="ready"
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onMarkReady}
          disabled={loadingAction === "ready"}
        >
          {loadingAction === "ready" ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.background.light}
              />
              <Text style={styles.primaryButtonText}>Marcar Pronto</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Status 4 - Pronto (Restaurante pode escanear QR Code)
    if (pedido.status === 4 && userType === "restaurante") {
      actions.push(
        <TouchableOpacity
          key="scan"
          style={[styles.actionButton, styles.successButton]}
          onPress={onScanQRCode}
          disabled={loadingAction === "delivering"}
        >
          {loadingAction === "delivering" ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="camera"
                size={16}
                color={colors.background.light}
              />
              <Text style={styles.successButtonText}>Escanear</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // ========== BOTÃO DETALHES (SEMPRE) ==========
    actions.unshift(
      <TouchableOpacity
        key="details"
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onViewDetails}
      >
        <Ionicons name="eye-outline" size={16} color={colors.text.light} />
        <Text style={styles.secondaryButtonText}>Detalhes</Text>
      </TouchableOpacity>
    );

    return <View style={styles.actionsContainer}>{actions}</View>;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.color }]}
          />
          <Text style={styles.code}>#{numeroPedido}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {nomeExibicao}
        </Text>

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{nomeSolicitante}</Text>
            <Text style={styles.infoText}>
              {totalItens} ticket{totalItens !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons
              name={statusConfig.icon}
              size={14}
              color={colors.muted.light}
            />
            <Text style={styles.timeText}>
              {dataPedido ? formatTime(dataPedido) : "N/A"}
            </Text>
          </View>
        </View>

        {observacoes && (
          <View style={styles.observationsContainer}>
            <Text style={styles.observationsText} numberOfLines={2}>
              {observacoes}
            </Text>
          </View>
        )}

        {pedido.status === 5 && allTicketsDelivered && (
          <View style={styles.deliveredBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.deliveredText}>Todos os tickets entregues</Text>
          </View>
        )}
      </View>

      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  code: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 8,
  },
  info: {
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: colors.muted.light,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.muted.light,
  },
  observationsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.border.light,
    borderRadius: 6,
  },
  observationsText: {
    fontSize: 12,
    color: colors.text.light,
  },
  deliveredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.success + "15",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  deliveredText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flex: 1,
    minWidth: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.background.light,
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.border.light,
  },
  secondaryButtonText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: colors.success,
  },
  successButtonText: {
    color: colors.background.light,
    fontSize: 12,
    fontWeight: "600",
  },
  warningButton: {
    backgroundColor: colors.primary,
  },
  warningButtonText: {
    color: colors.background.light,
    fontSize: 12,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: colors.destructive.light,
  },
  dangerButtonText: {
    color: colors.background.light,
    fontSize: 12,
    fontWeight: "600",
  },
});
