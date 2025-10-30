// src/screens/tickets/ScannerScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../constants/colors";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TicketDetails } from "../../components/tickets/components/TicketDetails";
import { ticketService, Ticket } from "../../api/tickets/ticketService";
import { useAuth } from "../../hooks/useAuth";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

interface ScanResult {
  type: "success" | "error" | "awaiting_token";
  message: string;
  ticketData?: any;
  ticket?: Ticket;
}

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [ticketNumero, setTicketNumero] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const formatToken = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  };

  const handleTokenChange = (value: string) => {
    const formatted = formatToken(value);
    setToken(formatted);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const decoded = JSON.parse(atob(data));
      const numero = decoded.idTicket || decoded.numero;

      setTicketNumero(numero);
      setScanResult({
        type: "awaiting_token",
        message: "QR Code lido com sucesso!",
        ticketData: decoded,
      });
    } catch {
      const numero = data.match(/\d+/)?.[0];

      if (numero) {
        setTicketNumero(numero);
        setScanResult({
          type: "awaiting_token",
          message: "QR Code lido com sucesso!",
          ticketData: { numero },
        });
      } else {
        setScanResult({
          type: "error",
          message: "QR Code inválido",
        });
      }
    }
  };

  const handleValidateToken = async () => {
    if (token.replace(/\D/g, "").length !== 6) {
      showErrorToast("Digite um token válido de 6 dígitos");
      return;
    }

    if (!user?.id_restaurante) {
      showErrorToast("Restaurante não identificado");
      return;
    }

    setValidating(true);

    try {
      const cleanToken = token.replace(/\D/g, "");
      const response = await ticketService.verificarTicketManual(
        ticketNumero,
        cleanToken,
        user.id_restaurante
      );

      if (response.success === false) {
        setScanResult({
          type: "error",
          message: response.message,
        });
        showErrorToast(response.message);
      } else {
        setScanResult({
          type: "success",
          message: "Ticket validado com sucesso!",
          ticket: response.ticket,
        });
        showSuccessToast("Ticket válido!");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Token inválido ou erro ao aprovar";

      setScanResult({
        type: "error",
        message: errorMessage,
      });
      showErrorToast(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const handleNewScan = () => {
    setScanResult(null);
    setToken("");
    setTicketNumero("");
    setScanned(false);
  };

  const handleTicketApproved = () => {
    showSuccessToast("Ticket aprovado com sucesso!");
    setTimeout(() => {
      handleNewScan();
    }, 1500);
  };

  const handleApproveTicket = async (ticketId: number, tokenValue: string) => {
    if (!user?.id_restaurante) {
      throw new Error("Restaurante não identificado");
    }

    const response = await ticketService.aprovarTicket(
      ticketId,
      tokenValue,
      user.id_restaurante
    );

    if (!response.success) {
      throw new Error(response.message);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top"]}>
        <Ionicons name="videocam-off" size={64} color={colors.muted.light} />
        <Text style={styles.errorText}>Sem acesso à câmera</Text>
        <Text style={styles.errorSubtext}>
          Permita o acesso à câmera nas configurações
        </Text>
        <Button onPress={() => navigation.goBack()} style={styles.backButton}>
          Voltar
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leitura de Tickets</Text>
        <View style={styles.headerRight} />
      </View>

      {!scanned ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />

              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />

                <View style={styles.scanBox}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>

                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Posicione o QR Code dentro da área
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
        >
          {scanResult?.type === "awaiting_token" && (
            <View style={styles.tokenSection}>
              {/* Alert de Sucesso */}
              <View style={styles.successAlert}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>{scanResult.message}</Text>
                  <Text style={styles.alertSubtitle}>
                    Ticket: #{ticketNumero}
                  </Text>
                  <Text style={styles.alertHint}>
                    Digite o token de 6 dígitos para validar e obter os detalhes
                    completos
                  </Text>
                </View>
              </View>

              {/* Input Token */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Token de Validação</Text>
                <Input
                  value={token}
                  onChangeText={handleTokenChange}
                  placeholder="123-456"
                  keyboardType="number-pad"
                  maxLength={7}
                  style={styles.tokenInput}
                  autoFocus
                />
                <Text style={styles.inputHint}>
                  Digite o token de 6 dígitos fornecido com este ticket
                </Text>
              </View>

              {/* Botões */}
              <View style={styles.buttonRow}>
                <Button
                  onPress={handleNewScan}
                  variant="outline"
                  style={styles.halfButton}
                >
                  Nova Leitura
                </Button>

                <Button
                  onPress={handleValidateToken}
                  disabled={validating || token.replace(/\D/g, "").length !== 6}
                  style={styles.halfButton}
                >
                  {validating ? (
                    <View style={styles.buttonLoading}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.buttonTextWhite}>Validando...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="key" size={18} color="#ffffff" />
                      <Text style={styles.buttonTextWhite}>Validar Token</Text>
                    </View>
                  )}
                </Button>
              </View>
            </View>
          )}

          {scanResult?.type === "success" && scanResult.ticket && (
            <View>
              {/* Success Alert */}
              <View style={styles.validAlert}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <View>
                  <Text style={styles.validTitle}>Ticket Válido!</Text>
                  <Text style={styles.validSubtitle}>Ticket válido</Text>
                </View>
              </View>

              {/* Ticket Details */}
              <TicketDetails
                ticket={scanResult.ticket}
                onApproved={handleTicketApproved}
                onApprove={handleApproveTicket}
              />
            </View>
          )}

          {scanResult?.type === "error" && (
            <View>
              <View style={styles.errorAlert}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colors.destructive.light}
                />
                <Text style={styles.errorTitle}>Erro!</Text>
                <Text style={styles.errorMessage}>{scanResult.message}</Text>
              </View>

              <Button onPress={handleNewScan} style={styles.fullButton}>
                Tentar Novamente
              </Button>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
  },
  headerRight: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.light,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.light,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.light,
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted.light,
    textAlign: "center",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: 280,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scanBox: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#ffffff",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    padding: 16,
  },
  tokenSection: {
    gap: 16,
  },
  successAlert: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  alertTextContainer: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  alertSubtitle: {
    fontSize: 12,
    color: colors.text.light,
  },
  alertHint: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  tokenInput: {
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 4,
  },
  inputHint: {
    fontSize: 12,
    color: colors.muted.light,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonTextWhite: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  validAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22C55E",
    marginBottom: 16,
  },
  validTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  validSubtitle: {
    fontSize: 12,
    color: "#059669",
  },
  errorAlert: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.destructive.light + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.destructive.light,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.destructive.light,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: "center",
  },
  fullButton: {
    marginTop: 8,
  },
});
