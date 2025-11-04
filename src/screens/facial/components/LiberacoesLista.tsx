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
}

export const LiberacoesLista: React.FC<Props> = ({
  liberacoes,
  funcionarioNome,
  funcionarioCpf,
  onConsumirLiberacao,
  isConsuming,
  consumingId,
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
            Este funcionário não possui liberações ativas no momento
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
      </Card>

      {/* Título da Seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Liberações Disponíveis</Text>
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
                  size={24}
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

            {/* Botão Consumir */}
            <TouchableOpacity
              style={[
                styles.consumirButton,
                isConsumingThis && styles.consumirButtonDisabled,
              ]}
              onPress={() => onConsumirLiberacao(liberacao.id)}
              disabled={isConsuming}
            >
              {isConsumingThis ? (
                <View style={styles.consumirButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.consumirButtonText}>Processando...</Text>
                </View>
              ) : (
                <View style={styles.consumirButtonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.consumirButtonText}>Consumir</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>
        );
      })}

      {/* Rodapé */}
      <View style={styles.footer}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.muted.light}
        />
        <Text style={styles.footerText}>
          Selecione uma liberação para gerar o ticket
        </Text>
      </View>
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
  },
  funcionarioCard: {
    padding: 16,
    marginBottom: 24,
  },
  funcionarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  liberacaoCard: {
    padding: 16,
    marginBottom: 12,
  },
  liberacaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  tipoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dataText: {
    fontSize: 14,
    color: colors.muted.light,
  },
  consumirButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  consumirButtonDisabled: {
    backgroundColor: colors.muted.light,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    padding: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.muted.light,
  },
});
