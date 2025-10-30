// src/screens/tickets/components/TicketDetails.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Ticket } from "../../../api/tickets/ticketService";
import { showErrorToast } from "../../../lib/toast";

interface TicketDetailsProps {
  ticket: Ticket;
  onApproved: () => void;
  onApprove?: (ticketId: number, token: string) => Promise<void>;
  showApproveButton?: boolean;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onApproved,
  onApprove,
  showApproveButton = true,
}) => {
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState("");
  const [approving, setApproving] = useState(false);

  const formatToken = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  };

  const handleTokenChange = (value: string) => {
    const formatted = formatToken(value);
    setToken(formatted);
  };

  const handleApproveClick = () => {
    if (ticket.token) {
      handleConfirmWithAutoToken();
    } else {
      setShowTokenInput(true);
    }
  };

  const handleConfirmWithAutoToken = async () => {
    if (!ticket.token || !onApprove) return;

    setApproving(true);
    try {
      await onApprove(ticket.id, ticket.token);
      onApproved();
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Erro ao aprovar ticket"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmToken = async () => {
    const cleanToken = token.replace(/\D/g, "");

    if (cleanToken.length !== 6) {
      showErrorToast("Digite um token válido de 6 dígitos");
      return;
    }

    if (!onApprove) return;

    setApproving(true);
    try {
      await onApprove(ticket.id, cleanToken);
      setShowTokenInput(false);
      onApproved();
    } catch (error) {
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Token incorreto ou erro ao aprovar"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleCancelToken = () => {
    setShowTokenInput(false);
    setToken("");
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "#3B82F6"; // Azul - Pendente
      case 2:
        return "#FB923C"; // Laranja - Em processo
      case 3:
        return "#22C55E"; // Verde - Aprovado
      case 4:
        return "#EF4444"; // Vermelho - Cancelado
      default:
        return colors.muted.light;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card style={styles.container}>
      {/* Header com Status */}
      <View style={styles.header}>
        <Text style={styles.title}>Detalhes do Ticket</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(ticket.status) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(ticket.status) },
            ]}
          >
            {ticket.status_texto}
          </Text>
        </View>
      </View>

      {/* Informações do Funcionário */}
      <View style={styles.section}>
        <View style={styles.highlightBox}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.highlightLabel}>Funcionário</Text>
        </View>
        <Text style={styles.highlightValue}>{ticket.funcionario.nome}</Text>
      </View>

      {/* Informações do Ticket */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="receipt" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Número:</Text>
          </View>
          <Text style={styles.infoValue}>#{ticket.numero}</Text>
        </View>

        <View style={styles.refeicaoBox}>
          <Text style={styles.refeicaoText}>{ticket.tipo_refeicao}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Emitido em:</Text>
          </View>
          <Text style={styles.infoValue}>
            {formatDate(ticket.data_emissao)}
          </Text>
        </View>

        {ticket.expiracao && (
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.labelText}>Expira em:</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(ticket.expiracao)}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="hourglass" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Status:</Text>
          </View>
          <Text
            style={[
              styles.infoValue,
              {
                color: ticket.tempo_restante.includes("Expirado")
                  ? "#EF4444"
                  : "#22C55E",
              },
            ]}
          >
            {ticket.tempo_restante}
          </Text>
        </View>
      </View>

      {/* Input de Token */}
      {showTokenInput && (
        <View style={styles.tokenSection}>
          <Text style={styles.tokenLabel}>
            Digite o token de validação para aprovar:
          </Text>
          <Input
            value={token}
            onChangeText={handleTokenChange}
            placeholder="123-456"
            keyboardType="number-pad"
            maxLength={7}
            style={styles.tokenInput}
            autoFocus
          />
          <Text style={styles.tokenHint}>
            Token de 6 dígitos fornecido com o ticket
          </Text>

          <View style={styles.tokenButtons}>
            <Button
              onPress={handleConfirmToken}
              disabled={approving || token.replace(/\D/g, "").length !== 6}
              style={styles.tokenButton}
            >
              {approving ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.buttonText}>Aprovando...</Text>
                </View>
              ) : (
                "Confirmar Token"
              )}
            </Button>

            <Button
              onPress={handleCancelToken}
              variant="outline"
              disabled={approving}
              style={styles.tokenButton}
            >
              Cancelar
            </Button>
          </View>
        </View>
      )}

      {/* Botão de Aprovar */}
      {ticket.status === 1 && showApproveButton && !showTokenInput && (
        <Button
          onPress={handleApproveClick}
          disabled={approving}
          style={styles.approveButton}
        >
          {approving ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.buttonText}>Aprovando...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons
                name={ticket.token ? "checkmark-circle" : "key"}
                size={20}
                color="#ffffff"
              />
              <Text style={styles.buttonText}>
                {ticket.token ? "Aprovar Ticket" : "Aprovar com Token"}
              </Text>
            </View>
          )}
        </Button>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  highlightLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.light,
    textAlign: "center",
  },
  infoSection: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.light,
  },
  refeicaoBox: {
    backgroundColor: "#22C55E20",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refeicaoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22C55E",
  },
  tokenSection: {
    backgroundColor: colors.primary + "10",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  tokenInput: {
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 4,
  },
  tokenHint: {
    fontSize: 12,
    color: colors.muted.light,
  },
  tokenButtons: {
    flexDirection: "row",
    gap: 8,
  },
  tokenButton: {
    flex: 1,
  },
  approveButton: {
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
