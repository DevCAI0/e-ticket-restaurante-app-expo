// src/screens/pedidos/ScanTicketAvulsoScreen.tsx - ✅ VERSÃO ATUALIZADA COM SCROLL
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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { colors } from "../../constants/colors";
import { api } from "../../lib/axios";

interface ScanTicketAvulsoScreenProps {
  route: {
    params: {
      pedidoId: number;
      itemId: number;
      onSuccess?: (ticketData: any) => void;
    };
  };
  navigation: any;
}

export function ScanTicketAvulsoScreen({
  route,
  navigation,
}: ScanTicketAvulsoScreenProps) {
  const { pedidoId, itemId, onSuccess } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [validatedTicket, setValidatedTicket] = useState<any>(null);
  const [tokenEditavel, setTokenEditavel] = useState("");

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const validarTicketAvulso = async (token: string) => {
    try {
      const response = await api.post(
        `/restaurante-pedidos/${pedidoId}/itens/${itemId}/validar-ticket-avulso`,
        { token }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || "Ticket inválido");
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Erro ao validar ticket"
      );
    }
  };

  const consumirTicket = async () => {
    if (!validatedTicket || !tokenEditavel.trim()) return;

    try {
      setProcessing(true);

      const response = await api.post(
        `/restaurante-pedidos/${pedidoId}/itens/${itemId}/entregar-avulso`,
        {
          nome: validatedTicket.nome,
          cpf: validatedTicket.cpf,
          token: tokenEditavel.trim(), // ✅ Usar o token editável
          observacao: `Ticket ${validatedTicket.numero} validado e consumido via QR Code`,
        }
      );

      if (response.data.success) {
        showSuccessToast("Ticket consumido com sucesso!");

        // Chamar callback de sucesso se existir
        if (onSuccess) {
          onSuccess(validatedTicket);
        }

        // Voltar para tela anterior
        navigation.goBack();
      } else {
        throw new Error(response.data.error || "Erro ao consumir ticket");
      }
    } catch (error: any) {
      showErrorToast(
        error.response?.data?.error ||
          error.message ||
          "Erro ao consumir ticket"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      // Extrair token do QR Code (pode estar em formato JSON ou direto)
      let token = data;
      try {
        const parsed = JSON.parse(data);
        token = parsed.token || parsed.numero || data;
      } catch {
        // Se não for JSON, usar o valor direto
        token = data;
      }

      const ticketData = await validarTicketAvulso(token);

      // ✅ Mostrar detalhes da validação antes de confirmar
      setValidatedTicket(ticketData.ticket);
      setTokenEditavel(ticketData.ticket.token || ticketData.ticket.codigo); // ✅ Preencher com o token/código validado
      setShowValidationDetails(true);
      Vibration.vibrate([100, 50, 100]);
    } catch (error: any) {
      showErrorToast(error.message || "Erro ao validar ticket");
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualTokenSubmit = async () => {
    if (!manualToken.trim()) {
      showErrorToast("Digite o token do ticket");
      return;
    }

    setShowManualModal(false);
    setProcessing(true);

    try {
      const ticketData = await validarTicketAvulso(manualToken.trim());

      // ✅ Mostrar detalhes da validação
      setValidatedTicket(ticketData.ticket);
      setTokenEditavel(ticketData.ticket.token || ticketData.ticket.codigo); // ✅ Preencher com o token/código validado
      setShowValidationDetails(true);
    } catch (error: any) {
      showErrorToast(error.message || "Erro ao validar ticket");
    } finally {
      setProcessing(false);
      setManualToken("");
    }
  };

  const handleConfirmValidation = async () => {
    if (!validatedTicket || !tokenEditavel.trim()) {
      showErrorToast("Token do ticket é obrigatório");
      return;
    }

    await consumirTicket();
  };

  const handleCancelValidation = () => {
    setShowValidationDetails(false);
    setValidatedTicket(null);
    setTokenEditavel("");
    setScanned(false);
  };

  const renderValidationDetailsModal = () => (
    <Modal
      visible={showValidationDetails}
      transparent
      animationType="slide"
      onRequestClose={handleCancelValidation}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.validationModal}>
          <View style={styles.validationHeader}>
            <View style={styles.validationIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={colors.success}
              />
            </View>
            <Text style={styles.validationTitle}>Ticket Validado!</Text>
            <Text style={styles.validationSubtitle}>
              Todas as validações foram realizadas com sucesso
            </Text>
          </View>

          <ScrollView
            style={styles.validationScrollView}
            contentContainerStyle={styles.validationScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {validatedTicket && (
              <>
                <View style={styles.validationItem}>
                  <View style={styles.validationItemHeader}>
                    <Ionicons name="ticket" size={20} color={colors.primary} />
                    <Text style={styles.validationItemTitle}>
                      Número do Ticket
                    </Text>
                  </View>
                  <Text style={styles.validationItemValue}>
                    {validatedTicket.numero || validatedTicket.codigo}
                  </Text>
                </View>

                <View style={styles.validationDivider} />

                <View style={styles.validationItem}>
                  <View style={styles.validationItemHeader}>
                    <Ionicons name="key" size={20} color={colors.primary} />
                    <Text style={styles.validationItemTitle}>
                      Token/Código do Ticket
                    </Text>
                  </View>
                  <TextInput
                    style={styles.tokenEditInput}
                    value={tokenEditavel}
                    onChangeText={setTokenEditavel}
                    placeholder="Token será preenchido automaticamente"
                    placeholderTextColor={colors.muted.light}
                    autoCapitalize="characters"
                  />
                  <Text style={styles.tokenHint}>
                    ✅ Token preenchido automaticamente - Você pode editá-lo se
                    necessário
                  </Text>
                </View>

                <View style={styles.validationDivider} />

                <View style={styles.validationItem}>
                  <View style={styles.validationItemHeader}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                    <Text style={styles.validationItemTitle}>Nome</Text>
                  </View>
                  <Text style={styles.validationItemValue}>
                    {validatedTicket.nome}
                  </Text>
                </View>

                {validatedTicket.cpf_formatado && (
                  <>
                    <View style={styles.validationDivider} />
                    <View style={styles.validationItem}>
                      <View style={styles.validationItemHeader}>
                        <Ionicons
                          name="card"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.validationItemTitle}>CPF</Text>
                      </View>
                      <Text style={styles.validationItemValue}>
                        {validatedTicket.cpf_formatado}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.validationDivider} />

                <View style={styles.validationItem}>
                  <View style={styles.validationItemHeader}>
                    <Ionicons
                      name="restaurant"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.validationItemTitle}>
                      Tipo de Refeição
                    </Text>
                  </View>
                  <Text style={styles.validationItemValue}>
                    {validatedTicket.tipo_refeicao}
                  </Text>
                </View>

                <View style={styles.validationDivider} />

                <View style={styles.validationItem}>
                  <View style={styles.validationItemHeader}>
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.validationItemTitle}>
                      Data de Validade
                    </Text>
                  </View>
                  <Text style={styles.validationItemValue}>
                    {validatedTicket.data_formatada}
                  </Text>
                </View>

                <View style={styles.validationChecklist}>
                  <View style={styles.checklistItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.checklistText}>Ticket de hoje ✓</Text>
                  </View>
                  <View style={styles.checklistItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.checklistText}>
                      Restaurante correto ✓
                    </Text>
                  </View>
                  <View style={styles.checklistItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.checklistText}>
                      Tipo de refeição compatível ✓
                    </Text>
                  </View>
                  <View style={styles.checklistItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.checklistText}>
                      Status válido (não consumido) ✓
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.validationFooter}>
            <TouchableOpacity
              style={styles.cancelValidationButton}
              onPress={handleCancelValidation}
            >
              <Text style={styles.cancelValidationButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmValidationButton,
                (!tokenEditavel.trim() || processing) &&
                  styles.confirmValidationButtonDisabled,
              ]}
              onPress={handleConfirmValidation}
              disabled={!tokenEditavel.trim() || processing}
            >
              {processing ? (
                <ActivityIndicator
                  size="small"
                  color={colors.background.light}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.background.light}
                  />
                  <Text style={styles.confirmValidationButtonText}>
                    Confirmar Entrega
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderManualTokenModal = () => (
    <Modal
      visible={showManualModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowManualModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Digitar Token Manualmente</Text>
            <TouchableOpacity
              onPress={() => {
                setShowManualModal(false);
                setManualToken("");
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.light} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Token do Ticket Avulso</Text>
            <TextInput
              style={styles.tokenInput}
              placeholder="Digite o token (ex: AV12345 ou código)"
              placeholderTextColor={colors.muted.light}
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowManualModal(false);
                  setManualToken("");
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  (!manualToken.trim() || processing) &&
                    styles.confirmModalButtonDisabled,
                ]}
                onPress={handleManualTokenSubmit}
                disabled={!manualToken.trim() || processing}
              >
                {processing ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.background.light}
                  />
                ) : (
                  <Text style={styles.confirmModalButtonText}>Validar</Text>
                )}
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
          <Text style={styles.headerTitle}>Escanear Ticket Avulso</Text>
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
          Escanear Ticket Avulso
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
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.success}
              />
              <Text style={styles.infoTitle}>Validação de Ticket</Text>
              <Text style={styles.infoSubtitle}>
                O sistema irá verificar automaticamente:
              </Text>
              <View style={styles.validationsList}>
                <Text style={styles.validationText}>
                  • Data de validade (hoje)
                </Text>
                <Text style={styles.validationText}>• Restaurante correto</Text>
                <Text style={styles.validationText}>• Tipo de refeição</Text>
                <Text style={styles.validationText}>• Status do ticket</Text>
              </View>
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
                  <ActivityIndicator size="large" color={colors.success} />
                  <Text style={styles.scannedText}>Validando...</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>

          <View style={styles.overlayBottom}>
            <Text style={styles.instruction}>
              Posicione o QR Code do ticket avulso dentro do quadro
            </Text>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualModal(true)}
              disabled={processing}
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

      {renderManualTokenModal()}
      {renderValidationDetailsModal()}
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    maxWidth: "90%",
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
    textAlign: "center",
  },
  validationsList: {
    marginTop: 8,
    alignSelf: "stretch",
  },
  validationText: {
    fontSize: 11,
    color: colors.text.light,
    marginTop: 4,
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
    paddingHorizontal: 32,
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  tokenInput: {
    backgroundColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    textAlign: "center",
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
  validationModal: {
    backgroundColor: colors.card.light,
    borderRadius: 24,
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  validationHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  validationIconContainer: {
    marginBottom: 12,
  },
  validationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 8,
  },
  validationSubtitle: {
    fontSize: 14,
    color: colors.muted.light,
    textAlign: "center",
  },
  validationScrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  validationScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  validationContent: {
    padding: 20,
  },
  validationItem: {
    marginBottom: 16,
  },
  validationItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  validationItemTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted.light,
    textTransform: "uppercase",
  },
  validationItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
  },
  tokenEditInput: {
    backgroundColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tokenHint: {
    fontSize: 11,
    color: colors.muted.light,
    marginTop: 6,
    fontStyle: "italic",
  },
  validationDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  validationChecklist: {
    marginTop: 20,
    backgroundColor: colors.success + "10",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checklistText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "600",
  },
  validationFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.card.light,
  },
  cancelValidationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.border.light,
    alignItems: "center",
  },
  cancelValidationButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
  },
  confirmValidationButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  confirmValidationButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.muted.light,
  },
  confirmValidationButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
});
