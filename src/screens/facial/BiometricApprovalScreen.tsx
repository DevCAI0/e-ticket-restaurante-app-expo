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

  // Detectar se está em modo pedido
  const isModoPedido =
    params.mode === "pedido" || (!!params.pedidoId && !!params.itemId);

  // Buscar dados do pedido se estiver em modo pedido
  useEffect(() => {
    const loadPedidoData = async () => {
      if (isModoPedido && params.pedidoId) {
        try {
          setLoadingPedido(true);
          console.log("🔍 Buscando dados do pedido:", params.pedidoId);

          const response = await PedidosAPI.obterPedido(params.pedidoId);

          if (response.success && response.pedido) {
            // ✅ Agora o pedido tem id_restaurante direto
            const idRestaurante = response.pedido.id_restaurante;
            setRestauranteId(idRestaurante);
            console.log("✅ ID do restaurante do pedido:", idRestaurante);
            console.log("📝 Dados do pedido:", {
              codigo: response.pedido.codigo_pedido,
              restaurante: response.pedido.restaurante?.nome,
              id_restaurante: idRestaurante,
              id_estabelecimento: response.pedido.id_estabelecimento,
            });
          } else {
            console.error("❌ Erro ao buscar pedido:", response);
            showErrorToast("Erro ao carregar dados do pedido");
            navigation.goBack();
          }
        } catch (error) {
          console.error("❌ Erro ao buscar dados do pedido:", error);
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
    // Determinar qual ID usar baseado no contexto
    let idParaVerificacao: number | null = null;

    if (isModoPedido) {
      // Em modo pedido, usar o ID do restaurante do pedido
      idParaVerificacao = restauranteId;
      console.log(
        "📦 Modo Pedido - Usando ID do restaurante do pedido:",
        idParaVerificacao
      );
    } else {
      // Em modo avulso, usar id_restaurante do usuário ou fallback para id_estabelecimento
      idParaVerificacao =
        user?.id_restaurante || user?.id_estabelecimento || null;
      console.log("🎫 Modo Avulso - Usando ID:", idParaVerificacao);
      console.log("   - id_restaurante:", user?.id_restaurante);
      console.log("   - id_estabelecimento:", user?.id_estabelecimento);
    }

    if (!idParaVerificacao) {
      showErrorToast("Erro: Restaurante não identificado");
      console.error("❌ Nenhum ID disponível para verificação");
      console.error("   - Modo pedido:", isModoPedido);
      console.error("   - ID restaurante do pedido:", restauranteId);
      console.error("   - ID restaurante do usuário:", user?.id_restaurante);
      console.error(
        "   - ID estabelecimento do usuário:",
        user?.id_estabelecimento
      );
      setStep("intro");
      return;
    }

    console.log("✅ Iniciando verificação biométrica");
    console.log("   - ID para verificação:", idParaVerificacao);
    console.log("   - Modo:", isModoPedido ? "Pedido" : "Avulso");

    setStep("processing");

    try {
      const verificationResult = await verificarIdentidade(
        imageUri,
        idParaVerificacao
      );

      console.log("📊 Resultado da verificação:", {
        success: verificationResult.success,
        funcionario: verificationResult.funcionario?.nome,
        total_liberacoes: verificationResult.total_liberacoes,
      });

      setResult(verificationResult);

      if (
        verificationResult.success &&
        verificationResult.total_liberacoes &&
        verificationResult.total_liberacoes > 0
      ) {
        console.log(
          "✅ Liberações encontradas:",
          verificationResult.total_liberacoes
        );
        setStep("liberacoes");
      } else {
        console.log("ℹ️ Nenhuma liberação disponível ou verificação falhou");
        setStep("result");
      }
    } catch (error) {
      console.error("❌ Erro na verificação:", error);
      showErrorToast("Erro ao verificar identidade");
      setStep("intro");
    }
  };

  const handleConsumirLiberacao = async (liberacaoId: number) => {
    // Determinar qual ID usar baseado no contexto
    let idRestauranteParaConsumo: number | null = null;

    if (isModoPedido) {
      // Em modo pedido, usar o ID do restaurante do pedido
      idRestauranteParaConsumo = restauranteId;
      console.log(
        "📦 Modo Pedido - Usando ID do restaurante do pedido:",
        idRestauranteParaConsumo
      );
    } else {
      // Em modo avulso, usar id_restaurante do usuário ou fallback para id_estabelecimento
      idRestauranteParaConsumo =
        user?.id_restaurante || user?.id_estabelecimento || null;
      console.log("🎫 Modo Avulso - Usando ID:", idRestauranteParaConsumo);
    }

    const estabelecimentoId = user?.id_estabelecimento;

    if (!idRestauranteParaConsumo || !estabelecimentoId) {
      showErrorToast("Dados do estabelecimento/restaurante não encontrados");
      console.error("❌ IDs necessários não disponíveis");
      console.error("   - ID restaurante:", idRestauranteParaConsumo);
      console.error("   - ID estabelecimento:", estabelecimentoId);
      return;
    }

    console.log("🎟️ Iniciando consumo de liberação:");
    console.log("   - Liberação ID:", liberacaoId);
    console.log("   - Restaurante ID:", idRestauranteParaConsumo);
    console.log("   - Estabelecimento ID:", estabelecimentoId);
    if (isModoPedido) {
      console.log("   - Pedido ID:", params.pedidoId);
      console.log("   - Item ID:", params.itemId);
    }

    setConsumingId(liberacaoId);
    setStep("consuming");

    try {
      const consumoResult = await consumirLiberacao(
        liberacaoId,
        idRestauranteParaConsumo,
        estabelecimentoId
      );

      console.log("📊 Resultado do consumo:", {
        success: consumoResult.success,
        ticket: consumoResult.ticket?.id,
        message: consumoResult.message,
      });

      if (consumoResult.success && consumoResult.ticket) {
        setTicketGerado(consumoResult.ticket);

        if (isModoPedido) {
          // Se está em modo pedido, precisamos vincular o ticket ao item do pedido
          if (params.pedidoId && params.itemId && result?.funcionario) {
            console.log("🔗 Vinculando ticket ao item do pedido...");
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
            console.log("✅ Executando callback onSuccess");
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
        console.error("❌ Falha no consumo:", consumoResult.message);
        showErrorToast(consumoResult.message);
        setStep("liberacoes");
      }
    } catch (error) {
      console.error("❌ Erro ao consumir liberação:", error);
      showErrorToast("Erro ao processar liberação");
      setStep("liberacoes");
    } finally {
      setConsumingId(undefined);
    }
  };

  // Função auxiliar para vincular o ticket ao item do pedido
  const vincularTicketAoItem = async (
    ticketId: number,
    pedidoId: number,
    itemId: number,
    funcionarioId: number,
    liberacaoId: number
  ) => {
    try {
      console.log("🔗 Vinculando ticket ao item do pedido:");
      console.log("   - Ticket ID:", ticketId);
      console.log("   - Pedido ID:", pedidoId);
      console.log("   - Item ID:", itemId);
      console.log("   - Funcionário ID:", funcionarioId);
      console.log("   - Liberação ID:", liberacaoId);

      // ✅ Chamar a API para entregar o item
      await PedidosAPI.entregarItemFuncionario(pedidoId, itemId, {
        funcionario_id: funcionarioId,
        liberacao_id: liberacaoId,
      });

      console.log("✅ Item entregue e ticket vinculado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao vincular ticket:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    console.log("❌ Captura cancelada pelo usuário");
    setStep("intro");
  };

  const handleRetry = () => {
    console.log("🔄 Tentando novamente...");
    setResult(null);
    setTicketGerado(null);
    setStep("intro");
  };

  const handleClose = () => {
    console.log("🚪 Fechando tela de aprovação biométrica");
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

          {/* Informação de debug em desenvolvimento */}
          {__DEV__ && (
            <Card style={styles.debugCard}>
              <Text style={styles.debugTitle}>🔍 Debug Info</Text>
              <Text style={styles.debugText}>
                Modo: {isModoPedido ? "Pedido" : "Avulso"}
              </Text>
              {isModoPedido && (
                <>
                  <Text style={styles.debugText}>
                    Pedido ID: {params.pedidoId || "null"}
                  </Text>
                  <Text style={styles.debugText}>
                    Item ID: {params.itemId || "null"}
                  </Text>
                  <Text style={styles.debugText}>
                    ID Restaurante (Pedido): {restauranteId || "carregando..."}
                  </Text>
                </>
              )}
              <Text style={styles.debugText}>Usuário: {user?.nome}</Text>
              <Text style={styles.debugText}>
                ID Restaurante (User): {user?.id_restaurante || "null"}
              </Text>
              <Text style={styles.debugText}>
                ID Estabelecimento: {user?.id_estabelecimento || "null"}
              </Text>
              <Text
                style={[
                  styles.debugText,
                  { fontWeight: "bold", color: colors.success },
                ]}
              >
                ID a ser usado:{" "}
                {isModoPedido
                  ? restauranteId || "carregando..."
                  : user?.id_restaurante || user?.id_estabelecimento || "null"}
              </Text>
            </Card>
          )}

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

      {step === "result" && result && !result.liberacoes_disponiveis && (
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
  debugCard: {
    width: "100%",
    padding: 12,
    marginBottom: 24,
    backgroundColor: colors.primary + "05",
    borderWidth: 1,
    borderColor: colors.primary + "20",
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.text.light,
    marginBottom: 4,
    fontFamily: "monospace",
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
