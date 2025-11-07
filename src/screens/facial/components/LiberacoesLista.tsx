// src/screens/facial/components/LiberacoesLista.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { Card } from "../../../components/ui/Card";

interface Liberacao {
  id: number;
  data: string;
  data_formatada: string;
  tipo_refeicao: {
    id: number;
    nome: string;
  };
}

interface Props {
  liberacoes: Liberacao[];
  funcionarioNome: string;
  funcionarioCpf: string;
  onConsumirLiberacao: (liberacaoId: number) => void;
  isConsuming: boolean;
  consumingId?: number;
  modoPedido?: boolean; // NOVO - indica se está em modo de entrega de pedido
}

export const LiberacoesLista: React.FC<Props> = ({
  liberacoes,
  funcionarioNome,
  funcionarioCpf,
  onConsumirLiberacao,
  isConsuming,
  consumingId,
  modoPedido = false, // NOVO - padrão false
}) => {
  const getTipoRefeicaoIcon = (tipoId: number) => {
    switch (tipoId) {
      case 1:
        return "cafe";
      case 2:
        return "fast-food";
      case 3:
        return "restaurant";
      case 4:
        return "moon";
      default:
        return "restaurant";
    }
  };

  const getTipoRefeicaoColor = (tipoId: number) => {
    switch (tipoId) {
      case 1:
        return "#8B4513"; // Café - marrom
      case 2:
        return "#FFA500"; // Lanche - laranja
      case 3:
        return "#4CAF50"; // Almoço - verde
      case 4:
        return "#2196F3"; // Jantar - azul
      default:
        return colors.primary;
    }
  };

  if (liberacoes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Card style={styles.emptyCard}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={colors.muted.light}
          />
          <Text style={styles.emptyTitle}>Nenhuma liberação disponível</Text>
          <Text style={styles.emptySubtitle}>
            {modoPedido
              ? "Este funcionário não possui liberações ativas para este tipo de refeição"
              : "Este funcionário não possui liberações ativas no momento"}
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Informações do Funcionário */}
      <Card style={styles.funcionarioCard}>
        <View style={styles.funcionarioHeader}>
          <View style={styles.funcionarioIconContainer}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.funcionarioInfo}>
            <Text style={styles.funcionarioNome}>{funcionarioNome}</Text>
            <Text style={styles.funcionarioCpf}>CPF: {funcionarioCpf}</Text>
          </View>
        </View>

        {/* Badge de sucesso */}
        <View style={styles.sucessoBadge}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.sucessoText}>Identificado com sucesso</Text>
        </View>
      </Card>

      {/* Título da Seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {modoPedido
            ? "Selecione a liberação para entregar"
            : "Liberações Disponíveis"}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{liberacoes.length}</Text>
        </View>
      </View>

      {/* Lista de Liberações */}
      {liberacoes.map((liberacao) => {
        const tipoColor = getTipoRefeicaoColor(liberacao.tipo_refeicao.id);
        const isConsumingThis = isConsuming && consumingId === liberacao.id;

        return (
          <Card key={liberacao.id} style={styles.liberacaoCard}>
            {/* Borda lateral colorida */}
            <View
              style={[styles.bordaLateral, { backgroundColor: tipoColor }]}
            />

            {/* Header da Liberação */}
            <View style={styles.liberacaoHeader}>
              <View
                style={[
                  styles.tipoIconContainer,
                  { backgroundColor: tipoColor + "20" },
                ]}
              >
                <Ionicons
                  name={getTipoRefeicaoIcon(liberacao.tipo_refeicao.id) as any}
                  size={28}
                  color={tipoColor}
                />
              </View>
              <View style={styles.liberacaoInfo}>
                <Text style={styles.tipoRefeicaoNome}>
                  {liberacao.tipo_refeicao.nome}
                </Text>
                <View style={styles.dataContainer}>
                  <Ionicons
                    name="calendar"
                    size={14}
                    color={colors.muted.light}
                  />
                  <Text style={styles.dataText}>
                    {liberacao.data_formatada}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão Consumir/Entregar */}
            <TouchableOpacity
              style={[
                styles.consumirButton,
                { backgroundColor: tipoColor },
                isConsumingThis && styles.consumirButtonDisabled,
              ]}
              onPress={() => onConsumirLiberacao(liberacao.id)}
              disabled={isConsuming}
            >
              {isConsumingThis ? (
                <View style={styles.consumirButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.consumirButtonText}>
                    {modoPedido ? "Entregando..." : "Processando..."}
                  </Text>
                </View>
              ) : (
                <View style={styles.consumirButtonContent}>
                  <Ionicons
                    name={modoPedido ? "checkmark-done" : "checkmark-circle"}
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.consumirButtonText}>
                    {modoPedido ? "Entregar Item" : "Consumir Ticket"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>
        );
      })}

      {/* Rodapé com informação */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoTitle}>Informação</Text>
        </View>
        <Text style={styles.infoText}>
          {modoPedido
            ? "Selecione uma liberação para entregar o item do pedido. O ticket será gerado e vinculado automaticamente ao item."
            : "Selecione uma liberação para gerar um ticket de refeição. O ticket será consumido imediatamente."}
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.light,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.muted.light,
    textAlign: "center",
    lineHeight: 20,
  },
  funcionarioCard: {
    padding: 16,
    marginBottom: 24,
  },
  funcionarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  funcionarioIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  funcionarioInfo: {
    flex: 1,
  },
  funcionarioNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
    marginBottom: 4,
  },
  funcionarioCpf: {
    fontSize: 14,
    color: colors.muted.light,
  },
  sucessoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.success + "10",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sucessoText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.light,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  liberacaoCard: {
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden", // Importante para a borda lateral
  },
  bordaLateral: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  liberacaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  tipoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  liberacaoInfo: {
    flex: 1,
  },
  tipoRefeicaoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 6,
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dataText: {
    fontSize: 13,
    color: colors.muted.light,
  },
  consumirButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  consumirButtonDisabled: {
    backgroundColor: colors.muted.light,
    opacity: 0.6,
  },
  consumirButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  consumirButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoCard: {
    padding: 16,
    marginTop: 8,
    backgroundColor: colors.primary + "05",
    borderWidth: 1,
    borderColor: colors.primary + "20",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.light,
    lineHeight: 20,
  },
});
