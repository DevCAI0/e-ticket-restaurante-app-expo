// src/screens/pedidos/QRScannerScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Vibration,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { PedidoSimplificado } from "../../types/pedidos";
import { PedidosAPI } from "../../api/pedidos";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { colors } from "../../constants/colors";

interface QRScannerScreenProps {
  route: {
    params: {
      pedido: PedidoSimplificado;
    };
  };
  navigation: any;
}

export function QRScannerScreen({ route, navigation }: QRScannerScreenProps) {
  const { pedido } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      const response = await PedidosAPI.escanearQRCodeEEntregar(
        pedido.id,
        data
      );

      if (response.success) {
        showSuccessToast(response.message || "Pedido entregue com sucesso!");
        navigation.goBack();
      } else {
        throw new Error(response.error || "QR Code inválido");
      }
    } catch (error: any) {
      showErrorToast(error.message || "Erro ao escanear QR Code");
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) {
      showErrorToast("Digite o código do pedido");
      return;
    }

    setShowManualModal(false);
    handleBarCodeScanned({ data: manualCode.trim() });
    setManualCode("");
  };

  const renderManualCodeModal = () => (
    <Modal
      visible={showManualModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowManualModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Digitar Código Manualmente</Text>
            <TouchableOpacity
              onPress={() => {
                setShowManualModal(false);
                setManualCode("");
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.light} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Código do Pedido (6 dígitos)</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.muted.light}
              value={manualCode}
              onChangeText={(text) => {
                const numbers = text.replace(/[^0-9]/g, "");
                setManualCode(numbers);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowManualModal(false);
                  setManualCode("");
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  manualCode.length !== 6 && styles.confirmModalButtonDisabled,
                ]}
                onPress={handleManualCodeSubmit}
                disabled={manualCode.length !== 6}
              >
                <Text style={styles.confirmModalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>Solicitando permissão da câmera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.text.light} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear QR Code</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons
            name="camera-outline"
            size={64}
            color={colors.muted.light}
          />
          <Text style={styles.errorTitle}>Sem Acesso à Câmera</Text>
          <Text style={styles.errorMessage}>
            Permita o acesso à câmera nas configurações do dispositivo
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.background.light} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.background.light }]}>
          Escanear QR Code
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.overlayTop}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                Pedido #{pedido.codigo_pedido}
              </Text>
              <Text style={styles.infoSubtitle}>
                {pedido.estabelecimento.nome}
              </Text>
            </View>
          </View>

          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {scanned && (
                <View style={styles.scannedOverlay}>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={colors.success}
                  />
                  <Text style={styles.scannedText}>QR Code Detectado!</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>

          <View style={styles.overlayBottom}>
            <Text style={styles.instruction}>
              Posicione o QR Code dentro do quadro
            </Text>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualModal(true)}
            >
              <Ionicons
                name="keypad"
                size={20}
                color={colors.background.light}
              />
              <Text style={styles.manualButtonText}>Digitar Código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderManualCodeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.light,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  message: {
    fontSize: 16,
    color: colors.muted.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.muted.light,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  infoCard: {
    backgroundColor: colors.card.light,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    textAlign: "center",
  },
  infoSubtitle: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 4,
    textAlign: "center",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: 300,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  scanFrame: {
    width: 300,
    height: 300,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannedOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannedText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
    marginTop: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    color: colors.background.light,
    marginBottom: 24,
    textAlign: "center",
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.background.light,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.light,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 24,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.border.light,
    alignItems: "center",
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  confirmModalButtonDisabled: {
    opacity: 0.5,
  },
  confirmModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
});
