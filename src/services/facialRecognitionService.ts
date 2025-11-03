// src/services/facialRecognitionService.ts
import axios from "axios";
import { Platform } from "react-native";

// Configuração da URL baseada no ambiente
const getBaseUrl = () => {
  // Para desenvolvimento
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://192.168.0.133:3000"; // Seu IP local
    }
    // iOS simulator pode usar localhost
    return "http://localhost:3000";
  }

  // Para produção (quando publicar)
  return "http://191.35.131.10:3000"; // Mesmo servidor do Laravel
};

const FACIAL_API_URL = getBaseUrl();

interface VerifyFaceRequest {
  imagem_base64: string;
  restaurante_id: number;
}

interface VerifyFaceResponse {
  success: boolean;
  message: string;
  data?: {
    funcionario_id: string;
    nome: string;
    similaridade: number;
    distancia: number;
    foto_referencia: string;
    tempo_processamento: number;
  };
  bestMatch?: {
    funcionarioId: string;
    similarity: number;
    threshold: number;
  };
  tempoProcessamento: number;
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

interface EmployeeData {
  id: string;
  imagesCount: number;
  images: string[];
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = FACIAL_API_URL;
    console.log(`🔗 Facial API URL: ${this.baseUrl}`);
  }

  /**
   * Verifica identidade facial contra o banco de fotos
   */
  async verificarRosto(params: VerifyFaceRequest): Promise<VerifyFaceResponse> {
    try {
      console.log("🔍 Iniciando verificação facial...");

      const response = await axios.post<VerifyFaceResponse>(
        `${this.baseUrl}/api/facial/verify`,
        params,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 segundos
        }
      );

      console.log("✅ Verificação concluída:", response.data.success);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao verificar rosto:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED") {
          throw new Error(
            "Servidor de reconhecimento facial não está disponível. Verifique se está rodando."
          );
        }
        if (error.response) {
          throw new Error(
            error.response.data?.message || "Erro ao verificar identidade"
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
   * Valida se imagem contém exatamente um rosto
   */
  async validarImagem(
    params: ValidateImageRequest
  ): Promise<ValidateImageResponse> {
    try {
      const response = await axios.post<ValidateImageResponse>(
        `${this.baseUrl}/api/facial/validate`,
        params,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Erro ao validar imagem:", error);
      throw error;
    }
  }

  /**
   * Lista funcionários com fotos cadastradas
   */
  async listarFuncionarios(): Promise<EmployeeData[]> {
    try {
      const response = await axios.get<{
        success: boolean;
        employees: EmployeeData[];
      }>(`${this.baseUrl}/api/facial/employees`, {
        timeout: 10000,
      });

      return response.data.employees || [];
    } catch (error) {
      console.error("❌ Erro ao listar funcionários:", error);
      throw error;
    }
  }

  /**
   * Verifica saúde da API de reconhecimento facial
   */
  async verificarSaude(): Promise<HealthCheckResponse> {
    try {
      const response = await axios.get<HealthCheckResponse>(
        `${this.baseUrl}/api/facial/health`,
        {
          timeout: 5000,
        }
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

  /**
   * Retorna a URL base configurada
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const facialRecognitionService = new FacialRecognitionService();
