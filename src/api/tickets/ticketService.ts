// src/services/ticketService.ts
import { api } from "../../lib/axios";

export interface Ticket {
  id: number;
  numero: number;
  token: string;
  token_formatado: string;
  codigo?: string;
  funcionario: {
    id_funcionario: number | null;
    nome: string;
    cpf: string;
  };
  tipo_refeicao: string;
  valor: number;
  status: number;
  status_texto: string;
  data_emissao: string;
  data_cadastro?: string;
  data_validade?: string;
  expiracao?: string;
  tempo_restante: string;
  expirado?: boolean;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  ticket?: Ticket;
  tipo?: "ticket_normal" | "ticket_avulso";
  pode_consumir?: boolean;
}

export class TicketService {
  private handleApiError(error: any): ApiResponse {
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || "Erro na operação",
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

  async lerQRCode(qrCode: string, restauranteId: number): Promise<ApiResponse> {
    try {
      if (!restauranteId) {
        throw new Error("Restaurante não identificado");
      }

      const response = await api.post<ApiResponse>(
        `/restaurantes/${restauranteId}/tickets/ler-qrcode`,
        { qr_code: qrCode }
      );

      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async verificarTicketManual(
    numeroTicket: string,
    token: string,
    restauranteId: number
  ): Promise<ApiResponse> {
    try {
      if (!restauranteId) {
        throw new Error("Restaurante não identificado");
      }

      const tokenRegex = /^\d{6}$/;
      if (!tokenRegex.test(token)) {
        throw new Error("Token deve conter exatamente 6 dígitos");
      }

      const response = await api.post<ApiResponse>(
        `/restaurantes/${restauranteId}/tickets/verificar-manual`,
        {
          numero_ticket: numeroTicket,
          token: token,
        }
      );

      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async aprovarTicket(
    ticketId: number,
    token: string,
    restauranteId: number
  ): Promise<ApiResponse> {
    try {
      if (!restauranteId) {
        throw new Error("Restaurante não identificado");
      }

      const tokenRegex = /^\d{6}$/;
      if (!tokenRegex.test(token)) {
        throw new Error("Token deve conter exatamente 6 dígitos");
      }

      const response = await api.post<ApiResponse>(
        `/restaurantes/${restauranteId}/tickets/${ticketId}/aprovar`,
        { token: token }
      );

      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async aprovarTicketAvulso(
    codigo: string,
    restauranteId: number
  ): Promise<ApiResponse> {
    try {
      if (!restauranteId) {
        throw new Error("Restaurante não identificado");
      }

      const response = await api.post<ApiResponse>(
        `/restaurantes/${restauranteId}/tickets/aprovar-avulso`,
        { codigo: codigo }
      );

      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const ticketService = new TicketService();
