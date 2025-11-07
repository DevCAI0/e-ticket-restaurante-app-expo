// src/screens/pedidos/QRCodeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Share,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { PedidoSimplificado } from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { showErrorToast, showSuccessToast } from "../../lib/toast";
import { colors } from "../../constants/colors";

interface QRCodeScreenProps {
  route: {
    params: {
      pedido: PedidoSimplificado;
    };
  };
  navigation: any;
}

export function QRCodeScreen({ route, navigation }: QRCodeScreenProps) {
  const { pedido } = route.params;
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      const response = await PedidosAPI.obterQRCode(pedido.id);

      if (response.success && response.qr_code_data) {
        setQrCodeData(response.qr_code_data);
      } else {
        throw new Error("QR Code não disponível");
      }
    } catch (error: any) {
      showErrorToast(error.message || "Erro ao carregar QR Code");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Código do Pedido: ${pedido.codigo_pedido}\n\nApresente este código no restaurante para retirar seu pedido.`,
        title: "Código do Pedido",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleCopyCode = () => {
    showSuccessToast("Código copiado!");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Gerando QR Code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code do Pedido</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.pedidoHeader}>
            <Text style={styles.codigoPedido}>#{pedido.codigo_pedido}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pronto</Text>
            </View>
          </View>
          <Text style={styles.restaurante}>{pedido.restaurante.nome}</Text>
          <Text style={styles.description}>
            Mostre este QR Code para o restaurante retirar seu pedido
          </Text>
        </View>

        {qrCodeData && (
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrCodeData}
                size={250}
                backgroundColor="white"
                color={colors.text.light}
              />
            </View>
          </View>
        )}

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código do Pedido</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{pedido.codigo_pedido}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Use este código caso não consiga escanear o QR Code
          </Text>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Como funciona?</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Dirija-se ao restaurante quando o pedido estiver pronto
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Mostre este QR Code para o atendente escanear
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Após confirmação, distribua os tickets aos funcionários
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.shareButtonText}>Compartilhar</Text>
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
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: colors.primary + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  codigoPedido: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.light,
  },
  statusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.background.light,
  },
  restaurante: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.text.light,
    lineHeight: 18,
  },
  qrCodeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  codeCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted.light,
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.border.light,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.light,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  codeHint: {
    fontSize: 11,
    color: colors.muted.light,
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.light,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.card.light,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary + "15",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});
