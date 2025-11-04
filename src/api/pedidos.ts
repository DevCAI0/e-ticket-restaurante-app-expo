import api from "../lib/axios";
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

export class PedidosAPI {
  private static readonly BASE_URL = "/restaurante-pedidos";

  static async listarPedidos(
    filters: PedidosFilters = {}
  ): Promise<PedidosListResponse> {
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

      const response = await api.get(`${this.BASE_URL}?${params.toString()}`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao listar pedidos");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Erro ao listar pedidos"
      );
    }
  }

  static async obterPedido(id: number): Promise<PedidoResponse> {
    try {
      const response = await api.get(`${this.BASE_URL}/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao obter pedido");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Erro ao obter pedido"
      );
    }
  }

  static async criarPedido(data: CriarPedidoRequest): Promise<PedidoResponse> {
    try {
      const response = await api.post(this.BASE_URL, data);

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
  }

  static async buscarTicketsDisponiveis(
    data: BuscarTicketsRequest
  ): Promise<any> {
    try {
      const response = await api.get(`${this.BASE_URL}/tickets-disponiveis`, {
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
  }

  static async listarRestaurantesDisponiveis(): Promise<any> {
    try {
      const response = await api.get(
        `${this.BASE_URL}/restaurantes-disponiveis`
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
  }

  static async cancelarPedido(
    id: number,
    motivoCancelamento?: string
  ): Promise<PedidoResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/${id}/cancelar`, {
        motivo_cancelamento: motivoCancelamento,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao cancelar pedido");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Erro ao cancelar pedido"
      );
    }
  }

  static async adicionarItens(
    id: number,
    data: AdicionarItensRequest
  ): Promise<PedidoResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/${id}/itens`, data);

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao adicionar itens");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Erro ao adicionar itens"
      );
    }
  }

  static async removerItem(
    pedidoId: number,
    itemId: number
  ): Promise<PedidoResponse> {
    try {
      const response = await api.delete(
        `${this.BASE_URL}/${pedidoId}/itens/${itemId}`
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
  }

  static async aceitarPedido(id: number): Promise<PedidoResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/${id}/aceitar`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao aceitar pedido");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Erro ao aceitar pedido"
      );
    }
  }

  static async recusarPedido(
    id: number,
    motivo: string
  ): Promise<PedidoResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/${id}/recusar`, {
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
  }

  static async marcarPronto(id: number): Promise<PedidoResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/${id}/pronto`, {});

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
  }

  static async obterQRCode(id: number): Promise<QRCodeResponse> {
    try {
      const response = await api.get(`${this.BASE_URL}/${id}/qr-code`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao obter QR Code");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Erro ao obter QR Code"
      );
    }
  }

  static async escanearQRCodeEEntregar(
    id: number,
    qrCodeData: string
  ): Promise<QRScanResponse> {
    try {
      const response = await api.post(
        `${this.BASE_URL}/${id}/escanear-entregar`,
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
        error.response?.data?.error ||
          error.message ||
          "Erro ao escanear QR Code"
      );
    }
  }

  static async marcarEntregue(
    id: number,
    codigoPedido?: string
  ): Promise<PedidoResponse> {
    try {
      const requestData = codigoPedido ? { codigo_pedido: codigoPedido } : {};

      const response = await api.post(
        `${this.BASE_URL}/${id}/entregar`,
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
  }
}
