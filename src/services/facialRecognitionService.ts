// src/services/facialRecognitionService.ts
import { api } from "../lib/axios";

export interface FacialRecognitionResult {
  success: boolean;
  message: string;
  data?: {
    funcionario_id: number;
    nome: string;
    foto_capturada: string;
    foto_referencia: string;
    similaridade: number;
    tempo_processamento: number;
  };
}

export interface StartRecognitionParams {
  restaurante_id: number;
  tipo_camera: "front" | "back";
}

export interface VerifyFaceParams {
  restaurante_id: number;
  imagem_base64: string;
  session_id?: string;
}

export class FacialRecognitionService {
  private handleApiError(error: any): FacialRecognitionResult {
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || "Erro na verificação facial",
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || "Erro de conexão",
      };
    }

    return {
      success: false,
      message: "Erro desconhecido",
    };
  }

  async iniciarSessao(
    params: StartRecognitionParams
  ): Promise<FacialRecognitionResult> {
    try {
      const response = await api.post<FacialRecognitionResult>(
        "/reconhecimento-facial/iniciar",
        params
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async verificarRosto(
    params: VerifyFaceParams
  ): Promise<FacialRecognitionResult> {
    try {
      const response = await api.post<FacialRecognitionResult>(
        "/reconhecimento-facial/verificar",
        params
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async aprovarTicketComBiometria(
    ticketId: number,
    imagemBase64: string,
    restauranteId: number
  ): Promise<FacialRecognitionResult> {
    try {
      const response = await api.post<FacialRecognitionResult>(
        `/restaurantes/${restauranteId}/tickets/${ticketId}/aprovar-biometria`,
        {
          imagem_facial: imagemBase64,
        }
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const facialRecognitionService = new FacialRecognitionService();
