// src/api/tickets/ticketsListService.ts
import { api } from "../../lib/axios";

export interface Funcionario {
  id_funcionario: number | null;
  nome: string;
  cpf: string;
}

export interface UsuarioLeitura {
  id: number;
  nome: string;
}

// ✅ NOVA INTERFACE para usuário de conferência
export interface UsuarioConferencia {
  id: number;
  nome: string;
}

export interface TicketData {
  id: number;
  numero: number;
  codigo?: string;
  funcionario: Funcionario | null;
  tipo_refeicao: string;
  valor: number;
  status: number;
  status_texto: string;
  data_emissao: string;
  data_cadastro: string;
  data_validade?: string;
  expiracao?: string;
  tempo_restante: string;
  data_hora_leitura_restaurante: string | null;
  usuario_leitura: UsuarioLeitura | null;
  // ✅ NOVOS CAMPOS de conferência (para tickets avulsos)
  id_usuario_leitura_conferencia?: number | null;
  data_hora_leitura_conferencia?: string | null;
  usuario_conferencia?: UsuarioConferencia | null;
  expirado?: boolean;
}

export interface TicketItem {
  tipo: "ticket_normal" | "ticket_avulso";
  data: TicketData;
}

export interface TicketsResponse {
  success: boolean;
  tickets: TicketItem[];
  total: number;
}

export const buscarTicketsRestaurante = async (
  idRestaurante: number,
  page: number = 1,
  perPage: number = 15
): Promise<TicketsResponse> => {
  try {
    const response = await api.get<TicketsResponse>(
      `/restaurantes/${idRestaurante}/tickets?page=${page}&per_page=${perPage}`
    );

    if (!response.data || !response.data.success) {
      throw new Error("Resposta inválida da API");
    }

    if (!Array.isArray(response.data.tickets)) {
      return {
        success: false,
        tickets: [],
        total: 0,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    throw error;
  }
};

export const buscarTicketsParaAtualizacao = async (
  idRestaurante: number,
  page: number = 1,
  perPage: number = 15
): Promise<TicketsResponse> => {
  try {
    const response = await api.get<TicketsResponse>(
      `/restaurantes/${idRestaurante}/tickets/atualizacao?page=${page}&per_page=${perPage}`
    );

    if (!response.data || !response.data.success) {
      throw new Error("Resposta inválida da API");
    }

    if (!Array.isArray(response.data.tickets)) {
      return {
        success: false,
        tickets: [],
        total: 0,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar tickets para atualização:", error);
    throw error;
  }
};
