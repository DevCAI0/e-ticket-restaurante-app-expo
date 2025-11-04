// src/hooks/useFacialRecognition.ts
import { useState } from "react";
import { facialRecognitionService } from "../services/facialRecognitionService";
import { showErrorToast, showSuccessToast } from "../lib/toast";

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

  /**
   * Verifica identidade facial e retorna liberações disponíveis
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
      const verificationResult =
        await facialRecognitionService.verificarIdentidadeFacial({
          imagem_base64: base64,
          restaurante_id: restauranteId,
        });

      let resultData: VerificationResult;

      if (verificationResult.success && verificationResult.funcionario) {
        resultData = {
          success: true,
          message: "Funcionário identificado com sucesso!",
          capturedImage: imageUri,
          referenceImage: verificationResult.funcionario.foto_referencia,
          funcionarioNome: verificationResult.funcionario.nome,
          funcionarioId: String(verificationResult.funcionario.id),
          similaridade: verificationResult.reconhecimento?.similaridade,
          tempoProcessamento:
            verificationResult.reconhecimento?.tempo_processamento,
          funcionario: verificationResult.funcionario,
          reconhecimento: verificationResult.reconhecimento,
          liberacoes_disponiveis: verificationResult.liberacoes_disponiveis,
          total_liberacoes: verificationResult.total_liberacoes,
        };

        showSuccessToast(`Bem-vindo, ${verificationResult.funcionario.nome}!`);

        if (verificationResult.total_liberacoes === 0) {
          showErrorToast("Nenhuma liberação disponível");
        }
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
   * Consome uma liberação e gera o ticket
   */
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

      if (result.success && result.ticket) {
        showSuccessToast(
          `Ticket ${result.ticket.numero} consumido com sucesso!`
        );

        // Limpar resultado da verificação após consumo
        setResult(null);
      } else {
        showErrorToast(result.message || "Erro ao consumir liberação");
      }

      return result;
    } catch (error) {
      console.error("Erro ao consumir liberação:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Erro ao consumir liberação";

      showErrorToast(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsConsuming(false);
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
    isConsuming,
    result,

    // Métodos
    verificarIdentidade,
    consumirLiberacao,
    verificarDisponibilidade,
    validarImagem,
    limparResultado,
  };
};
