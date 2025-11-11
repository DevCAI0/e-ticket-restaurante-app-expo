// src/api/pedidos.ts
import { api } from "../lib/axios";
import {
  PedidosListResponse,
  PedidoResponse,
  CriarPedidoRequest,
  CriarPedidoResponse,
  PedidosFilters,
  QRCodeResponse,
  QRScanResponse,
  EntregarItemFuncionarioRequest,
  EntregarItemAvulsoRequest,
} from "../types/pedidos";

// ===== FUNÇÕES PARA ESTABELECIMENTO =====

export const listarRestaurantesDisponiveis = async (): Promise<any> => {
  try {
    const response = await api.get(
      `/restaurante-pedidos/restaurantes-disponiveis`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao listar restaurantes");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Erro ao listar restaurantes"
    );
  }
};

export const criarPedido = async (
  data: CriarPedidoRequest
): Promise<CriarPedidoResponse> => {
  try {
    const response = await api.post("/restaurante-pedidos", data);

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao criar pedido");
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.validation_errors;
      if (validationErrors) {
        const errorMessages = Object.values(validationErrors).flat();
        throw new Error((errorMessages as string[]).join(", "));
      }
    }

    throw new Error(
      error.response?.data?.error || error.message || "Erro ao criar pedido"
    );
  }
};

export const entregarItemFuncionario = async (
  pedidoId: number,
  itemId: number,
  data: EntregarItemFuncionarioRequest
): Promise<any> => {
  try {
    const response = await api.post(
      `/restaurante-pedidos/${pedidoId}/itens/${itemId}/entregar-funcionario`,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao entregar item");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao entregar item"
    );
  }
};

export const validarTicketAvulso = async (
  pedidoId: number,
  itemId: number,
  token: string
): Promise<any> => {
  try {
    const response = await api.post(
      `/restaurante-pedidos/${pedidoId}/itens/${itemId}/validar-ticket-avulso`,
      { token }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao validar ticket avulso");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Erro ao validar ticket avulso"
    );
  }
};

export const entregarItemAvulso = async (
  pedidoId: number,
  itemId: number,
  data: EntregarItemAvulsoRequest
): Promise<any> => {
  try {
    const response = await api.post(
      `/restaurante-pedidos/${pedidoId}/itens/${itemId}/entregar-avulso`,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao entregar item avulso");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Erro ao entregar item avulso"
    );
  }
};

export const obterQRCode = async (id: number): Promise<QRCodeResponse> => {
  try {
    const response = await api.get(`/restaurante-pedidos/${id}/qr-code`);

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao obter QR Code");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao obter QR Code"
    );
  }
};

// ===== FUNÇÕES PARA RESTAURANTE =====

export const aceitarPedido = async (id: number): Promise<PedidoResponse> => {
  try {
    const response = await api.post(`/restaurante-pedidos/${id}/aceitar`, {});

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao aceitar pedido");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao aceitar pedido"
    );
  }
};

export const marcarPronto = async (id: number): Promise<PedidoResponse> => {
  try {
    const response = await api.post(`/restaurante-pedidos/${id}/pronto`, {});

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao marcar como pronto");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Erro ao marcar como pronto"
    );
  }
};

export const recusarPedido = async (
  id: number,
  motivo: string
): Promise<PedidoResponse> => {
  try {
    const response = await api.post(`/restaurante-pedidos/${id}/recusar`, {
      motivo_recusa: motivo,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao recusar pedido");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao recusar pedido"
    );
  }
};

export const escanearQRCodeEEntregar = async (
  id: number,
  qrCodeData: string
): Promise<QRScanResponse> => {
  try {
    const response = await api.post(
      `/restaurante-pedidos/${id}/escanear-entregar`,
      {
        qr_code_data: qrCodeData,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "QR Code inválido");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao escanear QR Code"
    );
  }
};

// ===== FUNÇÕES COMPARTILHADAS =====

export const listarPedidos = async (
  filters: PedidosFilters = {}
): Promise<PedidosListResponse> => {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(`${key}[]`, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/restaurante-pedidos?${params.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao listar pedidos");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao listar pedidos"
    );
  }
};

export const obterPedido = async (id: number): Promise<PedidoResponse> => {
  try {
    const response = await api.get(`/restaurante-pedidos/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao obter pedido");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao obter pedido"
    );
  }
};

export const cancelarPedido = async (
  id: number,
  motivoCancelamento?: string
): Promise<PedidoResponse> => {
  try {
    const response = await api.post(`/restaurante-pedidos/${id}/cancelar`, {
      motivo_cancelamento: motivoCancelamento,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao cancelar pedido");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao cancelar pedido"
    );
  }
};

// Exportar como objeto PedidosAPI
export const PedidosAPI = {
  // Estabelecimento
  listarRestaurantesDisponiveis,
  criarPedido,
  entregarItemFuncionario,
  validarTicketAvulso,
  entregarItemAvulso,
  obterQRCode,

  // Restaurante
  aceitarPedido,
  marcarPronto,
  recusarPedido,
  escanearQRCodeEEntregar,

  // Compartilhadas
  listarPedidos,
  obterPedido,
  cancelarPedido,
};

// Tipo do objeto PedidosAPI
export type PedidosAPIType = typeof PedidosAPI;
