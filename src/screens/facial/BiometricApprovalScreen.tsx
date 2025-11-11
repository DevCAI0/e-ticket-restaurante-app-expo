// src/screens/facial/BiometricApprovalScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../constants/colors";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FacialCamera } from "../facial/components/FacialCamera";
import { FacialResult } from "./components/FacialResult";
import { LiberacoesLista } from "./components/LiberacoesLista";
import { useFacialRecognition } from "../../hooks/useFacialRecognition";
import { useAuth } from "../../hooks/useAuth";
import { PedidosAPI } from "../../api/pedidos";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

type Step =
  | "intro"
  | "camera"
  | "processing"
  | "liberacoes"
  | "consuming"
  | "result";

interface RouteParams {
  mode?: "pedido" | "avulso";
  pedidoId?: number;
  itemId?: number;
  onSuccess?: () => void;
}

interface VerificationResult {
  success: boolean;
  message: string;
  capturedImage?: string;
  referenceImage?: string;
  funcionarioNome?: string;
  similaridade?: number;
  tempoProcessamento?: number;
  funcionario?: {
    id: number;
    nome: string;
    cpf: string;
    foto_referencia?: string;
  };
  liberacoes_disponiveis?: Array<{
    id: number;
    data: string;
    data_formatada: string;
    tipo_refeicao: {
      id: number;
      nome: string;
    };
  }>;
  total_liberacoes?: number;
  item_pedido?: {
    id: number;
    pedido_id: number;
    tipo_refeicao_id: number;
  };
}

export const BiometricApprovalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params as RouteParams) || {};

  const { user } = useAuth();
  const { verificarIdentidade, consumirLiberacao, isVerifying, isConsuming } =
    useFacialRecognition();

  const [step, setStep] = useState<Step>("intro");
  const [cameraType, setCameraType] = useState<"front" | "back">("front");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [consumingId, setConsumingId] = useState<number | undefined>();
  const [ticketGerado, setTicketGerado] = useState<any>(null);
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [loadingPedido, setLoadingPedido] = useState(false);

  const isModoPedido =
    params.mode === "pedido" || (!!params.pedidoId && !!params.itemId);

  useEffect(() => {
    const loadPedidoData = async () => {
      if (isModoPedido && params.pedidoId) {
        try {
          setLoadingPedido(true);

          const response = await PedidosAPI.obterPedido(params.pedidoId);

          if (response.success && response.pedido) {
            const idRestaurante = response.pedido.id_restaurante;
            setRestauranteId(idRestaurante);
          } else {
            showErrorToast("Erro ao carregar dados do pedido");
            navigation.goBack();
          }
        } catch (error) {
          showErrorToast("Erro ao carregar dados do pedido");
          navigation.goBack();
        } finally {
          setLoadingPedido(false);
        }
      }
    };

    loadPedidoData();
  }, [isModoPedido, params.pedidoId]);

  const handleStartCamera = (type: "front" | "back") => {
    setCameraType(type);
    setStep("camera");
  };

  const handleCapture = async (imageUri: string) => {
    let idParaVerificacao: number | null = null;

    if (isModoPedido) {
      idParaVerificacao = restauranteId;
    } else {
      idParaVerificacao =
        user?.id_restaurante || user?.id_estabelecimento || null;
    }

    if (!idParaVerificacao) {
      showErrorToast("Erro: Restaurante não identificado");
      setStep("intro");
      return;
    }

    setStep("processing");

    try {
      const verificationResult = await verificarIdentidade(
        imageUri,
        idParaVerificacao
      );

      setResult(verificationResult);

      if (verificationResult.success) {
        if (
          verificationResult.total_liberacoes &&
          verificationResult.total_liberacoes > 0
        ) {
          setStep("liberacoes");
        } else {
          setStep("result");
        }
      } else {
        setStep("result");
      }
    } catch (error) {
      showErrorToast("Erro ao verificar identidade");
      setStep("intro");
    }
  };

  const handleConsumirLiberacao = async (liberacaoId: number) => {
    let idRestauranteParaConsumo: number | null = null;

    if (isModoPedido) {
      idRestauranteParaConsumo = restauranteId;
    } else {
      idRestauranteParaConsumo =
        user?.id_restaurante || user?.id_estabelecimento || null;
    }

    const estabelecimentoId = user?.id_estabelecimento;

    if (!idRestauranteParaConsumo || !estabelecimentoId) {
      showErrorToast("Dados do estabelecimento/restaurante não encontrados");
      return;
    }

    setConsumingId(liberacaoId);
    setStep("consuming");

    try {
      const consumoResult = await consumirLiberacao(
        liberacaoId,
        idRestauranteParaConsumo,
        estabelecimentoId
      );

      if (consumoResult.success && consumoResult.ticket) {
        setTicketGerado(consumoResult.ticket);

        if (isModoPedido) {
          if (params.pedidoId && params.itemId && result?.funcionario) {
            await vincularTicketAoItem(
              consumoResult.ticket.id,
              params.pedidoId,
              params.itemId,
              result.funcionario.id,
              liberacaoId
            );
          }

          showSuccessToast("Item do pedido entregue com sucesso!");

          if (params.onSuccess) {
            params.onSuccess();
          }

          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        } else {
          showSuccessToast("Ticket gerado com sucesso!");

          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }
      } else {
        showErrorToast(consumoResult.message);
        setStep("liberacoes");
      }
    } catch (error) {
      showErrorToast("Erro ao processar liberação");
      setStep("liberacoes");
    } finally {
      setConsumingId(undefined);
    }
  };

  const vincularTicketAoItem = async (
    ticketId: number,
    pedidoId: number,
    itemId: number,
    funcionarioId: number,
    liberacaoId: number
  ) => {
    try {
      await PedidosAPI.entregarItemFuncionario(pedidoId, itemId, {
        funcionario_id: funcionarioId,
        liberacao_id: liberacaoId,
        ticket_id: ticketId,
      });
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    setStep("intro");
  };

  const handleRetry = () => {
    setResult(null);
    setTicketGerado(null);
    setStep("intro");
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const renderIntro = () => {
    if (loadingPedido) {
      return (
        <View style={styles.processingContainer}>
          <Card style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingTitle}>Carregando dados...</Text>
            <Text style={styles.processingSubtitle}>
              Buscando informações do pedido
            </Text>
          </Card>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.introCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="scan" size={64} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.introTitle}>
            {isModoPedido
              ? "Entregar Item via Biometria"
              : "Verificação Biométrica"}
          </Text>
          <Text style={styles.introSubtitle}>
            {isModoPedido
              ? "Identifique o funcionário através do reconhecimento facial para entregar o item do pedido"
              : "Identifique o funcionário através do reconhecimento facial para visualizar suas liberações disponíveis"}
          </Text>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Como funciona:</Text>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionStep}>1. Escolha a câmera</Text>
                <Text style={styles.instructionDescription}>
                  Selecione câmera frontal ou traseira
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="scan-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionStep}>2. Capture o rosto</Text>
                <Text style={styles.instructionDescription}>
                  Posicione o rosto do funcionário na tela
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="list" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionStep}>
                  3. Veja as liberações
                </Text>
                <Text style={styles.instructionDescription}>
                  Lista de refeições disponíveis será exibida
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionStep}>
                  {isModoPedido ? "4. Entregar item" : "4. Consuma o ticket"}
                </Text>
                <Text style={styles.instructionDescription}>
                  {isModoPedido
                    ? "Selecione a refeição para entregar o item"
                    : "Selecione a refeição para gerar o ticket"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              onPress={() => handleStartCamera("front")}
              style={styles.button}
              disabled={isModoPedido && !restauranteId}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="camera-reverse" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Câmera Frontal</Text>
              </View>
            </Button>

            <Button
              onPress={() => handleStartCamera("back")}
              variant="outline"
              style={styles.button}
              disabled={isModoPedido && !restauranteId}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={styles.buttonTextOutline}>Câmera Traseira</Text>
              </View>
            </Button>

            {isModoPedido && !restauranteId && (
              <View style={styles.warningContainer}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.warningText}>
                  Carregando dados do pedido...
                </Text>
              </View>
            )}

            <Button
              onPress={() => navigation.goBack()}
              variant="ghost"
              style={styles.buttonCancel}
            >
              Cancelar
            </Button>
          </View>
        </Card>
      </ScrollView>
    );
  };

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <Card style={styles.processingCard}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingTitle}>Verificando identidade...</Text>
        <Text style={styles.processingSubtitle}>
          Analisando a foto e buscando liberações disponíveis
        </Text>
        {isVerifying && (
          <Text style={styles.processingHint}>
            Isso pode levar alguns segundos...
          </Text>
        )}
      </Card>
    </View>
  );

  const renderConsuming = () => (
    <View style={styles.processingContainer}>
      <Card style={styles.processingCard}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingTitle}>
          {isModoPedido ? "Entregando item..." : "Gerando ticket..."}
        </Text>
        <Text style={styles.processingSubtitle}>
          {isModoPedido
            ? "Aguarde enquanto processamos a entrega"
            : "Aguarde enquanto processamos a liberação"}
        </Text>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isModoPedido ? "Entregar Item" : "Aprovar com Biometria"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {step === "intro" && renderIntro()}

      {step === "camera" && (
        <FacialCamera
          cameraType={cameraType}
          onCapture={handleCapture}
          onCancel={handleCancel}
          funcionarioNome={user?.nome}
          solicitarSorriso={false}
        />
      )}

      {step === "processing" && renderProcessing()}

      {step === "liberacoes" &&
        result?.funcionario &&
        result?.liberacoes_disponiveis && (
          <LiberacoesLista
            liberacoes={result.liberacoes_disponiveis}
            funcionarioNome={result.funcionario.nome}
            funcionarioCpf={result.funcionario.cpf}
            onConsumirLiberacao={handleConsumirLiberacao}
            isConsuming={isConsuming}
            consumingId={consumingId}
            modoPedido={isModoPedido}
          />
        )}

      {step === "consuming" && renderConsuming()}

      {step === "result" && result && (
        <FacialResult
          success={result.success}
          message={result.message}
          capturedImage={result.capturedImage}
          referenceImage={result.referenceImage}
          funcionarioNome={result.funcionarioNome}
          similaridade={result.similaridade}
          tempoProcessamento={result.tempoProcessamento}
          onClose={handleClose}
          onRetry={handleRetry}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  introCard: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.light,
    marginBottom: 12,
    textAlign: "center",
  },
  introSubtitle: {
    fontSize: 16,
    color: colors.muted.light,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  instructionsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    flex: 1,
    justifyContent: "center",
  },
  instructionStep: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: colors.muted.light,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
  },
  buttonCancel: {
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  buttonTextOutline: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.warning + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + "30",
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: "500",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  processingCard: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.light,
    textAlign: "center",
  },
  processingSubtitle: {
    fontSize: 14,
    color: colors.muted.light,
    textAlign: "center",
    lineHeight: 20,
  },
  processingHint: {
    fontSize: 12,
    color: colors.muted.light,
    textAlign: "center",
    fontStyle: "italic",
  },
});
