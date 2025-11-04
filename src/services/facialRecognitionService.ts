// src/services/facialRecognitionService.ts
import { api } from "../lib/axios";
import axios from "axios";

interface VerifyFaceRequest {
  imagem_base64: string;
  restaurante_id: number;
}

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

interface VerifyFaceResponse {
  success: boolean;
  message: string;
  funcionario?: Funcionario;
  reconhecimento?: Reconhecimento;
  liberacoes_disponiveis?: Liberacao[];
  total_liberacoes?: number;
}

interface ConsumirLiberacaoRequest {
  liberacao_id: number;
  restaurante_id: number;
  estabelecimento_id: number;
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

interface ConsumirLiberacaoResponse {
  success: boolean;
  message: string;
  ticket?: TicketConsumido;
  liberacao?: {
    id: number;
    data: string;
    tipo_refeicao: string;
  };
}

interface ValidateImageRequest {
  imagem_base64: string;
}

interface ValidateImageResponse {
  success: boolean;
  valid: boolean;
  facesCount: number;
  message: string;
}

interface HealthCheckResponse {
  success: boolean;
  status: string;
  modelsLoaded?: boolean;
  employeesWithFaces?: number;
  config?: {
    similarityThreshold: number;
    minConfidence: number;
    facesBasePath: string;
  };
}

class FacialRecognitionService {
  /**
   * Verifica identidade facial e retorna liberações disponíveis
   */
  async verificarIdentidadeFacial(
    params: VerifyFaceRequest
  ): Promise<VerifyFaceResponse> {
    try {
      console.log("🔍 Iniciando verificação facial...");
      console.log("📋 Parâmetros:", {
        restaurante_id: params.restaurante_id,
        imagem_tamanho: params.imagem_base64?.length || 0,
      });

      const response = await api.post<VerifyFaceResponse>(
        "/restaurante/facial/verificar",
        params
      );

      console.log("✅ Verificação concluída:", response.data.success);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao verificar identidade:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        if (error.response?.status === 404) {
          throw new Error(
            "Endpoint não encontrado. Verifique se a API está configurada corretamente."
          );
        }
        if (error.response) {
          const errorData = error.response.data as any;
          throw new Error(
            errorData?.error ||
              errorData?.message ||
              "Erro ao verificar identidade"
          );
        }
        if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED") {
          throw new Error(
            "Servidor não está disponível. Verifique sua conexão."
          );
        }
        if (error.request) {
          throw new Error(
            "Não foi possível conectar ao servidor. Verifique sua conexão."
          );
        }
      }

      throw new Error("Erro ao processar verificação facial");
    }
  }

  /**
   * Consome liberação e gera ticket
   */
  async consumirLiberacao(
    params: ConsumirLiberacaoRequest
  ): Promise<ConsumirLiberacaoResponse> {
    try {
      console.log("🎫 Consumindo liberação...");
      console.log("📋 Parâmetros:", params);

      const response = await api.post<ConsumirLiberacaoResponse>(
        "/restaurante/facial/consumir-liberacao",
        params
      );

      console.log("✅ Liberação consumida:", response.data.success);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao consumir liberação:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        if (error.response) {
          const errorData = error.response.data as any;
          throw new Error(
            errorData?.error ||
              errorData?.message ||
              "Erro ao consumir liberação"
          );
        }
        if (error.request) {
          throw new Error(
            "Não foi possível conectar ao servidor. Verifique sua conexão."
          );
        }
      }

      throw new Error("Erro ao consumir liberação");
    }
  }

  /**
   * Valida se imagem contém exatamente um rosto
   */
  async validarImagem(
    params: ValidateImageRequest
  ): Promise<ValidateImageResponse> {
    try {
      const response = await api.post<ValidateImageResponse>(
        "/restaurante/facial/validate",
        params
      );

      return response.data;
    } catch (error) {
      console.error("❌ Erro ao validar imagem:", error);
      throw error;
    }
  }

  /**
   * Verifica saúde da API de reconhecimento facial
   */
  async verificarSaude(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get<HealthCheckResponse>(
        "/restaurante/facial/health"
      );

      return response.data;
    } catch (error) {
      console.error("❌ Erro ao verificar saúde da API:", error);
      return {
        success: false,
        status: "offline",
        modelsLoaded: false,
        employeesWithFaces: 0,
      };
    }
  }
}

export const facialRecognitionService = new FacialRecognitionService();
