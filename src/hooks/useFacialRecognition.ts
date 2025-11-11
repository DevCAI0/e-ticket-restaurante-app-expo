// src/hooks/useFacialRecognition.ts
import { useState } from "react";
import { facialRecognitionService } from "../services/facialRecognitionService";

interface Liberacao {
  id: number;
  data: string;
  data_formatada: string;
  tipo_refeicao: {
    id: number;
    nome: string;
  };
}

interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  foto_referencia?: string;
}

interface Reconhecimento {
  similaridade: number;
  distancia?: number;
  tempo_processamento: number;
}

interface VerificationResult {
  success: boolean;
  message: string;
  capturedImage?: string;
  referenceImage?: string;
  funcionarioNome?: string;
  funcionarioId?: string;
  similaridade?: number;
  tempoProcessamento?: number;
  funcionario?: Funcionario;
  reconhecimento?: Reconhecimento;
  liberacoes_disponiveis?: Liberacao[];
  total_liberacoes?: number;
}

interface TicketConsumido {
  id: number;
  numero: string;
  token: string;
  token_formatado: string;
  funcionario: {
    id: number;
    nome: string;
    cpf: string;
  };
  tipo_refeicao: {
    id: number;
    nome: string;
  };
  restaurante: {
    id: number;
    nome: string;
  };
  valor: number;
  valor_formatado: string;
  status: number;
  status_texto: string;
  data_consumo: string;
  data_liberacao: string;
}

interface ConsumoResult {
  success: boolean;
  message: string;
  ticket?: TicketConsumido;
  liberacao?: {
    id: number;
    data: string;
    tipo_refeicao: string;
  };
}

export const useFacialRecognition = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verificarIdentidade = async (
    imageUri: string,
    restauranteId: number
  ): Promise<VerificationResult> => {
    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const verificationResult =
        await facialRecognitionService.verificarIdentidadeFacial({
          imagem_base64: base64,
          restaurante_id: restauranteId,
        });

      let resultData: VerificationResult;

      if (verificationResult.funcionario) {
        resultData = {
          success: true,
          message:
            verificationResult.total_liberacoes &&
            verificationResult.total_liberacoes > 0
              ? "Funcionário identificado com sucesso!"
              : "Funcionário identificado, mas não possui liberações disponíveis hoje",
          capturedImage: imageUri,
          referenceImage: verificationResult.funcionario.foto_referencia,
          funcionarioNome: verificationResult.funcionario.nome,
          funcionarioId: String(verificationResult.funcionario.id),
          similaridade: verificationResult.reconhecimento?.similaridade,
          tempoProcessamento:
            verificationResult.reconhecimento?.tempo_processamento,
          funcionario: verificationResult.funcionario,
          reconhecimento: verificationResult.reconhecimento,
          liberacoes_disponiveis:
            verificationResult.liberacoes_disponiveis || [],
          total_liberacoes: verificationResult.total_liberacoes || 0,
        };
      } else {
        resultData = {
          success: false,
          message:
            verificationResult.message ||
            "Não foi possível identificar o funcionário. Tente novamente.",
          capturedImage: imageUri,
        };
      }

      setResult(resultData);
      return resultData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        const errorData = error.response?.data;

        if (errorData?.funcionario) {
          const resultData: VerificationResult = {
            success: true,
            message:
              "Funcionário identificado, mas não possui liberações disponíveis hoje",
            capturedImage: imageUri,
            referenceImage: errorData.funcionario.foto_referencia,
            funcionarioNome: errorData.funcionario.nome,
            funcionarioId: String(errorData.funcionario.id),
            similaridade: errorData.reconhecimento?.similaridade,
            tempoProcessamento: errorData.reconhecimento?.tempo_processamento,
            funcionario: errorData.funcionario,
            reconhecimento: errorData.reconhecimento,
            liberacoes_disponiveis: [],
            total_liberacoes: 0,
          };

          setResult(resultData);
          return resultData;
        }

        const errorResult: VerificationResult = {
          success: false,
          message:
            errorData?.error ||
            "Não foi possível identificar o funcionário. Tente novamente.",
          capturedImage: imageUri,
        };

        setResult(errorResult);
        return errorResult;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao processar reconhecimento facial. Tente novamente.";

      const errorResult: VerificationResult = {
        success: false,
        message: errorMessage,
        capturedImage: imageUri,
      };

      setResult(errorResult);
      return errorResult;
    } finally {
      setIsVerifying(false);
    }
  };

  const consumirLiberacao = async (
    liberacaoId: number,
    restauranteId: number,
    estabelecimentoId: number
  ): Promise<ConsumoResult> => {
    setIsConsuming(true);

    try {
      const result = await facialRecognitionService.consumirLiberacao({
        liberacao_id: liberacaoId,
        restaurante_id: restauranteId,
        estabelecimento_id: estabelecimentoId,
      });

      if (result.success) {
        setResult(null);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao consumir liberação";

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsConsuming(false);
    }
  };

  const verificarDisponibilidade = async () => {
    setIsCheckingHealth(true);

    try {
      const health = await facialRecognitionService.verificarSaude();

      if (health.success && health.status === "online") {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    } finally {
      setIsCheckingHealth(false);
    }
  };

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
      throw error;
    }
  };

  const limparResultado = () => {
    setResult(null);
  };

  return {
    isVerifying,
    isCheckingHealth,
    isConsuming,
    result,
    verificarIdentidade,
    consumirLiberacao,
    verificarDisponibilidade,
    validarImagem,
    limparResultado,
  };
};
