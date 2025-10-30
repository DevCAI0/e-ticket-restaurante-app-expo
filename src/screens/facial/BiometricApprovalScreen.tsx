// src/screens/facial/BiometricApprovalScreen.tsx
import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../constants/colors";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FacialCamera } from "../facial/components/FacialCamera";
import { FacialResult } from "./components/FacialResult";
import { facialRecognitionService } from "../../services/facialRecognitionService";
import { useAuth } from "../../hooks/useAuth";
import { showErrorToast } from "../../lib/toast";

type Step = "intro" | "camera" | "processing" | "result";

interface VerificationResult {
  success: boolean;
  message: string;
  capturedImage?: string;
  referenceImage?: string;
  funcionarioNome?: string;
  similaridade?: number;
  tempoProcessamento?: number;
}

export const BiometricApprovalScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [cameraType, setCameraType] = useState<"front" | "back">("front");
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleStartCamera = (type: "front" | "back") => {
    setCameraType(type);
    setStep("camera");
  };

  const handleCapture = async (imageUri: string) => {
    setStep("processing");

    if (!user?.id_restaurante) {
      showErrorToast("Restaurante não identificado");
      setStep("intro");
      return;
    }

    try {
      // Converter imagem para base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;

        try {
          const verificationResult =
            await facialRecognitionService.verificarRosto({
              restaurante_id: user.id_restaurante!,
              imagem_base64: base64data,
            });

          if (verificationResult.success && verificationResult.data) {
            setResult({
              success: true,
              message: "Identidade confirmada com sucesso!",
              capturedImage: imageUri,
              referenceImage: verificationResult.data.foto_referencia,
              funcionarioNome: verificationResult.data.nome,
              similaridade: verificationResult.data.similaridade,
              tempoProcessamento: verificationResult.data.tempo_processamento,
            });
          } else {
            setResult({
              success: false,
              message:
                verificationResult.message ||
                "Não foi possível verificar sua identidade",
              capturedImage: imageUri,
            });
          }

          setStep("result");
        } catch (error) {
          console.error("Erro ao verificar rosto:", error);
          setResult({
            success: false,
            message: "Erro ao processar verificação facial",
            capturedImage: imageUri,
          });
          setStep("result");
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      showErrorToast("Erro ao processar imagem");
      setStep("intro");
    }
  };

  const handleCancel = () => {
    setStep("intro");
  };

  const handleRetry = () => {
    setResult(null);
    setStep("intro");
  };

  const handleClose = () => {
    if (result?.success) {
      // Aqui você pode navegar para aprovar tickets ou outra ação
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  const renderIntro = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <Card style={styles.introCard}>
        {/* Ícone */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="scan" size={64} color={colors.primary} />
          </View>
        </View>

        {/* Título */}
        <Text style={styles.introTitle}>Verificação Biométrica</Text>
        <Text style={styles.introSubtitle}>
          Para aprovar tickets, precisamos verificar sua identidade através do
          reconhecimento facial
        </Text>

        {/* Instruções */}
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
              <Text style={styles.instructionStep}>2. Posicione seu rosto</Text>
              <Text style={styles.instructionDescription}>
                Mantenha seu rosto dentro do oval na tela
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="happy" size={24} color={colors.primary} />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionStep}>3. Sorria</Text>
              <Text style={styles.instructionDescription}>
                Aguarde enquanto capturamos sua foto
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
              <Text style={styles.instructionStep}>4. Confirmação</Text>
              <Text style={styles.instructionDescription}>
                Verificaremos sua identidade automaticamente
              </Text>
            </View>
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => handleStartCamera("front")}
            style={styles.button}
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
          >
            <View style={styles.buttonContent}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.buttonTextOutline}>Câmera Traseira</Text>
            </View>
          </Button>

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

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <Card style={styles.processingCard}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingTitle}>Verificando identidade...</Text>
        <Text style={styles.processingSubtitle}>
          Analisando sua foto e comparando com nosso banco de dados
        </Text>
      </Card>
    </View>
  );

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
        <Text style={styles.headerTitle}>Aprovar com Biometria</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {step === "intro" && renderIntro()}

      {step === "camera" && (
        <FacialCamera
          onCapture={handleCapture}
          onCancel={handleCancel}
          funcionarioNome={user?.nome}
          solicitarSorriso={true}
        />
      )}

      {step === "processing" && renderProcessing()}

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
  },
});
