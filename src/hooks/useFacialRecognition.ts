// src/hooks/useFacialRecognition.ts
import { useState } from "react";
import { facialRecognitionService } from "../services/facialRecognitionService";
import { showErrorToast, showSuccessToast } from "../lib/toast";

interface VerificationResult {
  success: boolean;
  message: string;
  capturedImage?: string;
  referenceImage?: string;
  funcionarioNome?: string;
  funcionarioId?: string;
  similaridade?: number;
  tempoProcessamento?: number;
}

export const useFacialRecognition = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  /**
   * Verifica identidade facial
   */
  const verificarIdentidade = async (
    imageUri: string,
    restauranteId: number
  ): Promise<VerificationResult> => {
    setIsVerifying(true);
    setResult(null);

    try {
      // Converter imagem para base64
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Enviar para API
      const verificationResult = await facialRecognitionService.verificarRosto({
        restaurante_id: restauranteId,
        imagem_base64: base64,
      });

      let resultData: VerificationResult;

      if (verificationResult.success && verificationResult.data) {
        resultData = {
          success: true,
          message: "Identidade confirmada com sucesso!",
          capturedImage: imageUri,
          referenceImage: verificationResult.data.foto_referencia,
          funcionarioNome: verificationResult.data.nome,
          funcionarioId: verificationResult.data.funcionario_id,
          similaridade: verificationResult.data.similaridade,
          tempoProcessamento: verificationResult.data.tempo_processamento,
        };

        showSuccessToast(`Bem-vindo, ${verificationResult.data.nome}!`);
      } else {
        resultData = {
          success: false,
          message:
            verificationResult.message ||
            "Não foi possível verificar sua identidade",
          capturedImage: imageUri,
        };

        showErrorToast(resultData.message);
      }

      setResult(resultData);
      return resultData;
    } catch (error) {
      console.error("Erro ao verificar identidade:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao processar verificação facial";

      const errorResult: VerificationResult = {
        success: false,
        message: errorMessage,
        capturedImage: imageUri,
      };

      setResult(errorResult);
      showErrorToast(errorMessage);

      return errorResult;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Verifica se a API está online
   */
  const verificarDisponibilidade = async () => {
    setIsCheckingHealth(true);

    try {
      const health = await facialRecognitionService.verificarSaude();

      if (health.success && health.status === "online") {
        showSuccessToast(
          `API Online: ${health.employeesWithFaces} funcionário(s) cadastrado(s)`
        );
        return true;
      } else {
        showErrorToast("API de reconhecimento facial offline");
        return false;
      }
    } catch (error) {
      showErrorToast("Erro ao verificar disponibilidade da API");
      return false;
    } finally {
      setIsCheckingHealth(false);
    }
  };

  /**
   * Valida se imagem contém um rosto válido
   */
  const validarImagem = async (imageUri: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const validationResult = await facialRecognitionService.validarImagem({
        imagem_base64: base64,
      });

      return validationResult;
    } catch (error) {
      console.error("Erro ao validar imagem:", error);
      throw error;
    }
  };

  /**
   * Limpa o resultado da verificação
   */
  const limparResultado = () => {
    setResult(null);
  };

  return {
    // Estados
    isVerifying,
    isCheckingHealth,
    result,

    // Métodos
    verificarIdentidade,
    verificarDisponibilidade,
    validarImagem,
    limparResultado,
  };
};
