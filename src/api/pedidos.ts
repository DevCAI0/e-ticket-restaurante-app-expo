// src/api/pedidos/index.ts
import { api } from "../lib/axios";
import {
  PedidosListResponse,
  PedidoResponse,
  CriarPedidoRequest,
  BuscarTicketsRequest,
  PedidosFilters,
  QRCodeResponse,
  QRScanResponse,
  AdicionarItensRequest,
} from "../types/pedidos";

// Funções individuais
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

export const criarPedido = async (
  data: CriarPedidoRequest
): Promise<PedidoResponse> => {
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

export const buscarTicketsDisponiveis = async (
  data: BuscarTicketsRequest
): Promise<any> => {
  try {
    const response = await api.get(`/restaurante-pedidos/tickets-disponiveis`, {
      params: data,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao buscar tickets");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao buscar tickets"
    );
  }
};

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

export const adicionarItens = async (
  id: number,
  data: AdicionarItensRequest
): Promise<PedidoResponse> => {
  try {
    const response = await api.post(`/restaurante-pedidos/${id}/itens`, data);

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao adicionar itens");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao adicionar itens"
    );
  }
};

export const removerItem = async (
  pedidoId: number,
  itemId: number
): Promise<PedidoResponse> => {
  try {
    const response = await api.delete(
      `/restaurante-pedidos/${pedidoId}/itens/${itemId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao remover item");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || error.message || "Erro ao remover item"
    );
  }
};

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

export const marcarEntregue = async (
  id: number,
  codigoPedido?: string
): Promise<PedidoResponse> => {
  try {
    const requestData = codigoPedido ? { codigo_pedido: codigoPedido } : {};

    const response = await api.post(
      `/restaurante-pedidos/${id}/entregar`,
      requestData
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Erro ao marcar como entregue");
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Erro ao marcar como entregue"
    );
  }
};

// Exportar como objeto PedidosAPI
export const PedidosAPI = {
  listarPedidos,
  obterPedido,
  criarPedido,
  buscarTicketsDisponiveis,
  listarRestaurantesDisponiveis,
  cancelarPedido,
  adicionarItens,
  removerItem,
  aceitarPedido,
  recusarPedido,
  marcarPronto,
  obterQRCode,
  escanearQRCodeEEntregar,
  marcarEntregue,
};

// Tipo do objeto PedidosAPI
export type PedidosAPIType = typeof PedidosAPI;
