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
}: PedidoCardProps) {
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          color: colors.yellow[500],
          bgColor: colors.yellow[100],
          textColor: colors.yellow[800],
          icon: "time-outline" as const,
          label: "Pendente",
        };
      case 3:
        return {
          color: colors.purple[500],
          bgColor: colors.purple[100],
          textColor: colors.purple[800],
          icon: "restaurant-outline" as const,
          label: "Em Preparo",
        };
      case 4:
        return {
          color: colors.orange[500],
          bgColor: colors.orange[100],
          textColor: colors.orange[800],
          icon: "checkmark-circle-outline" as const,
          label: "Pronto",
        };
      case 5:
        return {
          color: colors.green[500],
          bgColor: colors.green[100],
          textColor: colors.green[800],
          icon: "checkmark-done-outline" as const,
          label: "Entregue",
        };
      case 6:
        return {
          color: colors.red[500],
          bgColor: colors.red[100],
          textColor: colors.red[800],
          icon: "close-circle-outline" as const,
          label: "Recusado",
        };
      case 7:
        return {
          color: colors.gray[500],
          bgColor: colors.gray[100],
          textColor: colors.gray[800],
          icon: "ban-outline" as const,
          label: "Cancelado",
        };
      default:
        return {
          color: colors.gray[500],
          bgColor: colors.gray[100],
          textColor: colors.gray[800],
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

  const renderActions = () => {
    const actions = [];

    // Status 1 - Pendente
    if (pedido.status === 1) {
      if (userType === "estabelecimento") {
        actions.push(
          <TouchableOpacity
            key="add"
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onAddItems}
            disabled={loadingAction !== ""}
          >
            {loadingAction === "adding" ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="add" size={16} color={colors.white} />
                <Text style={styles.primaryButtonText}>Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        );

        actions.push(
          <TouchableOpacity
            key="cancel"
            style={[styles.actionButton, styles.dangerButton]}
            onPress={onCancel}
            disabled={loadingAction === "canceling"}
          >
            {loadingAction === "canceling" ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={styles.dangerButtonText}>Cancelar</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }

      if (userType === "restaurante") {
        actions.push(
          <TouchableOpacity
            key="accept"
            style={[styles.actionButton, styles.successButton]}
            onPress={onAccept}
            disabled={loadingAction === "accepting"}
          >
            {loadingAction === "accepting" ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color={colors.white} />
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
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="close" size={16} color={colors.white} />
                <Text style={styles.dangerButtonText}>Recusar</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }
    }

    // Status 3 - Em Preparo
    if (pedido.status === 3 && userType === "restaurante") {
      actions.push(
        <TouchableOpacity
          key="ready"
          style={[styles.actionButton, styles.warningButton]}
          onPress={onMarkReady}
          disabled={loadingAction === "ready"}
        >
          {loadingAction === "ready" ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.white}
              />
              <Text style={styles.warningButtonText}>Pronto</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Status 4 - Pronto
    if (pedido.status === 4) {
      if (userType === "estabelecimento") {
        actions.push(
          <TouchableOpacity
            key="qr"
            style={[styles.actionButton, styles.successButton]}
            onPress={onShowQRCode}
          >
            <Ionicons name="qr-code" size={16} color={colors.white} />
            <Text style={styles.successButtonText}>QR Code</Text>
          </TouchableOpacity>
        );
      }

      if (userType === "restaurante") {
        actions.push(
          <TouchableOpacity
            key="scan"
            style={[styles.actionButton, styles.successButton]}
            onPress={onScanQRCode}
            disabled={loadingAction === "delivering"}
          >
            {loadingAction === "delivering" ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="camera" size={16} color={colors.white} />
                <Text style={styles.successButtonText}>Escanear</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }
    }

    // Botão Ver Detalhes sempre presente
    actions.unshift(
      <TouchableOpacity
        key="details"
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onViewDetails}
      >
        <Ionicons name="eye-outline" size={16} color={colors.gray[700]} />
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
          <Text style={styles.code}>#{pedido.codigo_pedido}</Text>
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
          {userType === "estabelecimento"
            ? pedido.restaurante.nome
            : pedido.estabelecimento.nome}
        </Text>

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{pedido.solicitante.nome}</Text>
            <Text style={styles.infoText}>
              {pedido.total_itens} ticket{pedido.total_itens !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons
              name={statusConfig.icon}
              size={14}
              color={colors.gray[600]}
            />
            <Text style={styles.timeText}>
              {formatTime(pedido.data_pedido)}
            </Text>
          </View>
        </View>

        {pedido.observacoes && (
          <View style={styles.observationsContainer}>
            <Text style={styles.observationsText} numberOfLines={2}>
              {pedido.observacoes}
            </Text>
          </View>
        )}

        {pedido.status === 5 && allTicketsDelivered && (
          <View style={styles.deliveredBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.green[700]}
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
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
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
    fontSize: 12,
    fontWeight: "600",
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
    color: colors.gray[900],
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
    color: colors.gray[600],
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  observationsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
  },
  observationsText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  deliveredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.green[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.green[200],
  },
  deliveredText: {
    fontSize: 11,
    color: colors.green[700],
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.gray[100],
  },
  secondaryButtonText: {
    color: colors.gray[700],
    fontSize: 12,
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: colors.green[600],
  },
  successButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  warningButton: {
    backgroundColor: colors.orange[600],
  },
  warningButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: colors.red[600],
  },
  dangerButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
