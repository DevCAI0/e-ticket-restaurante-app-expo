// src/services/facialRecognitionService.ts
import { api } from "../lib/axios";
import axios from "axios";

interface VerifyFaceRequest {
  imagem_base64: string;
  restaurante_id: number;
  pedido_id?: number;
  item_id?: number;
}

interface Liberacao {
  id: number;
  data: string;
  data_formatada: string;
  tipo_refeicao: {
    id: number;
    nome: string;
    horario_inicio?: string;
    horario_fim?: string;
    horario_fim_com_tolerancia?: string;
  };
  disponivel_ate?: string;
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
  hora_atual?: string;
  modo_pedido?: boolean;
  tolerancia_adicional?: string;
  item_pedido?: {
    id: number;
    pedido_id: number;
    tipo_refeicao_id: number;
  };
  liberacoes_fora_horario?: Array<{
    tipo_refeicao: string;
    horario_inicio: string;
    horario_fim: string;
  }>;
}

interface ConsumirLiberacaoRequest {
  liberacao_id: number;
  restaurante_id: number;
  estabelecimento_id: number;
  pedido_id?: number;
  item_id?: number;
}

interface TicketConsumido {
  id: number;
  numero: string;
  token: string;
  token_formatado: string;
  id_pedido?: number;
  data_incluido_pedido?: string;
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
  item_pedido?: {
    id: number;
    pedido_id: number;
    entregue: boolean;
    data_entrega: string;
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
  async verificarIdentidadeFacial(
    params: VerifyFaceRequest
  ): Promise<VerifyFaceResponse> {
    try {
      const response = await api.post<VerifyFaceResponse>(
        "/restaurante/facial/verificar",
        params
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Erro 400 - Fora do horário ou sem liberações no horário
        if (error.response?.status === 400) {
          const errorData = error.response.data as any;

          // Se tem funcionário identificado mas está fora do horário
          if (errorData?.funcionario) {
            return {
              success: false,
              message:
                errorData.error || "Liberações fora do horário permitido",
              funcionario: errorData.funcionario,
              reconhecimento: errorData.reconhecimento,
              liberacoes_disponiveis: [],
              total_liberacoes: 0,
              hora_atual: errorData.hora_atual,
              liberacoes_fora_horario: errorData.liberacoes_fora_horario,
            };
          }

          throw new Error(
            errorData?.error || "Erro ao verificar liberações disponíveis"
          );
        }

        // Erro 404 - Funcionário identificado mas sem liberações
        if (error.response?.status === 404) {
          const errorData = error.response.data as any;

          if (errorData?.funcionario) {
            return {
              success: true,
              message:
                errorData.error ||
                "Funcionário identificado, mas não possui liberações disponíveis hoje",
              funcionario: errorData.funcionario,
              reconhecimento: errorData.reconhecimento,
              liberacoes_disponiveis: [],
              total_liberacoes: 0,
              hora_atual: errorData.hora_atual,
            };
          }

          throw new Error(errorData?.error || "Funcionário não identificado");
        }

        if (error.response?.status === 401) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
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

  async consumirLiberacao(
    params: ConsumirLiberacaoRequest
  ): Promise<ConsumirLiberacaoResponse> {
    try {
      const response = await api.post<ConsumirLiberacaoResponse>(
        "/restaurante/facial/consumir-liberacao",
        params
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }

        if (error.response?.status === 400) {
          const errorData = error.response.data as any;

          // Erros de horário
          if (
            errorData?.error?.includes("Muito cedo") ||
            errorData?.error?.includes("expirada") ||
            errorData?.error?.includes("expirado")
          ) {
            throw new Error(errorData.error);
          }

          throw new Error(
            errorData?.error ||
              errorData?.message ||
              "Erro ao consumir liberação"
          );
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
      throw error;
    }
  }

  async verificarSaude(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get<HealthCheckResponse>(
        "/restaurante/facial/health"
      );

      return response.data;
    } catch (error) {
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
