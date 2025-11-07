// src/screens/pedidos/CancelarPedidoScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PedidoSimplificado } from "../../../types/pedidos";
import { PedidosAPI } from "../../../api/pedidos";
import { showSuccessToast, showErrorToast } from "../../../lib/toast";
import { colors } from "../../../constants/colors";

interface CancelarPedidoScreenProps {
  route: {
    params: {
      pedido: PedidoSimplificado;
    };
  };
  navigation: any;
}

export function CancelarPedidoScreen({
  route,
  navigation,
}: CancelarPedidoScreenProps) {
  const { pedido } = route.params;
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const motivosComuns = [
    "Mudança de planos",
    "Número incorreto de refeições",
    "Horário inadequado",
    "Problema operacional",
    "Outro motivo",
  ];

  const handleSelectMotivo = (motivoSelecionado: string) => {
    if (motivoSelecionado === "Outro motivo") {
      setMotivo("");
    } else {
      setMotivo(motivoSelecionado);
    }
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      showErrorToast("Por favor, informe o motivo do cancelamento");
      return;
    }

    try {
      setLoading(true);
      const response = await PedidosAPI.cancelarPedido(pedido.id, motivo);

      if (response.success) {
        showSuccessToast("Pedido cancelado com sucesso");
        navigation.goBack();
      }
    } catch (error: any) {
      showErrorToast(error.message || "Erro ao cancelar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancelar Pedido</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pedidoCard}>
          <Text style={styles.pedidoCode}>#{pedido.codigo_pedido}</Text>
          <Text style={styles.pedidoRestaurante}>
            {pedido.restaurante.nome}
          </Text>
          <Text style={styles.pedidoInfo}>
            {pedido.quantidade_total} itens • {pedido.tipo_refeicao}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo do Cancelamento</Text>
          <Text style={styles.sectionDescription}>
            Selecione um motivo ou escreva um personalizado
          </Text>

          <View style={styles.motivosContainer}>
            {motivosComuns.map((motivoComum) => (
              <TouchableOpacity
                key={motivoComum}
                style={[
                  styles.motivoChip,
                  motivo === motivoComum && styles.motivoChipActive,
                ]}
                onPress={() => handleSelectMotivo(motivoComum)}
              >
                <Text
                  style={[
                    styles.motivoChipText,
                    motivo === motivoComum && styles.motivoChipTextActive,
                  ]}
                >
                  {motivoComum}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Descreva o motivo do cancelamento..."
            placeholderTextColor={colors.muted.light}
            value={motivo}
            onChangeText={setMotivo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.alertCard}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.alertText}>
            Sua quota será devolvida e o restaurante será notificado sobre o
            cancelamento.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            loading && styles.confirmButtonDisabled,
          ]}
          onPress={handleCancelar}
          disabled={loading || !motivo.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <>
              <Ionicons
                name="trash"
                size={20}
                color={colors.background.light}
              />
              <Text style={styles.confirmButtonText}>Cancelar Pedido</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pedidoCard: {
    backgroundColor: colors.muted.light + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pedidoCode: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 4,
  },
  pedidoRestaurante: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 4,
  },
  pedidoInfo: {
    fontSize: 13,
    color: colors.muted.light,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.muted.light,
    marginBottom: 16,
  },
  motivosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  motivoChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.border.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  motivoChipActive: {
    backgroundColor: colors.muted.light + "15",
    borderColor: colors.muted.light,
  },
  motivoChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.light,
  },
  motivoChipTextActive: {
    color: colors.text.light,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: colors.border.light,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: colors.text.light,
    minHeight: 100,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.info + "15",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.info + "30",
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.light,
    lineHeight: 18,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.muted.light,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
});
