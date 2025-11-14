// src/components/tickets/components/TicketCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../constants/colors";

interface TicketCardProps {
  numero: number;
  funcionario?: {
    nome: string;
  } | null;
  tipo_refeicao: string;
  data_emissao: string;
  status_texto: string;
  data_hora_leitura_restaurante?: string | null;
  usuario_leitura?: {
    id: number;
    nome: string;
  } | null;
  // ✅ NOVOS PROPS para conferência (tickets avulsos)
  data_hora_leitura_conferencia?: string | null;
  usuario_conferencia?: {
    id: number;
    nome: string;
  } | null;
  tipo?: "ticket_normal" | "ticket_avulso";
}

export const TicketCard: React.FC<TicketCardProps> = ({
  numero,
  funcionario,
  tipo_refeicao,
  data_emissao,
  status_texto,
  data_hora_leitura_restaurante,
  usuario_leitura,
  // ✅ NOVOS PROPS
  data_hora_leitura_conferencia,
  usuario_conferencia,
  tipo = "ticket_normal",
}) => {
  const getStatusStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "consumido") {
      return {
        backgroundColor: "#DCFCE7",
        color: "#166534",
      };
    } else if (statusLower === "expirado") {
      return {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
      };
    } else if (statusLower === "pendente") {
      return {
        backgroundColor: "#FEF3C7",
        color: "#854D0E",
      };
    }
    return {
      backgroundColor: colors.muted.light,
      color: colors.text.light,
    };
  };

  const statusStyle = getStatusStyle(status_texto);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  // ✅ Verificar se é ticket avulso
  const isTicketAvulso = tipo === "ticket_avulso";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.ticketNumber}>
          Ticket #{isTicketAvulso ? `${numero}` : numero}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.backgroundColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {status_texto}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Funcionário</Text>
          <Text style={styles.value}>{funcionario?.nome || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Refeição</Text>
          <Text style={styles.value}>{tipo_refeicao}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Emissão</Text>
          <Text style={styles.value}>{formatDate(data_emissao)}</Text>
        </View>

        {/* Exibir informações de leitura do restaurante (para todos os tickets) */}
        {usuario_leitura && data_hora_leitura_restaurante && (
          <>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Conferido por</Text>
              <Text style={styles.value}>{usuario_leitura.nome}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Data conferência</Text>
              <Text style={styles.value}>
                {formatDate(data_hora_leitura_restaurante)}
              </Text>
            </View>
          </>
        )}

        {/* ✅ EXIBIR CONFERÊNCIA ADICIONAL (apenas para tickets avulsos) */}
        {isTicketAvulso && usuario_conferencia && (
          <>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Conferido por</Text>
              <Text style={styles.value}>{usuario_conferencia.nome}</Text>
            </View>

            {data_hora_leitura_conferencia && (
              <View style={styles.row}>
                <Text style={styles.label}>Data conferência</Text>
                <Text style={styles.value}>
                  {formatDate(data_hora_leitura_conferencia)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: colors.muted.light,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.light,
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 8,
  },
});
