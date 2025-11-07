// src/types/pedidos.ts
export interface Estabelecimento {
  id: number;
  nome: string;
  logradouro?: string;
}

export interface Restaurante {
  id: number;
  nome: string;
  logradouro?: string;
}

export interface TipoRefeicaoDisponivel {
  id: number;
  nome: string;
  valor: number;
  valor_formatado: string;
  quota_total: number;
  quota_utilizada: number;
  quota_disponivel: number;
}

export interface RestauranteDisponivel {
  id: number;
  nome: string;
  logradouro?: string;
  tem_configuracao: boolean;
  tipos_refeicao_disponiveis: TipoRefeicaoDisponivel[];
}

export interface Usuario {
  id: number;
  nome: string;
}

export interface TipoRefeicao {
  id: number;
  nome: string;
}

export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
}

export interface Ticket {
  id: number;
  numero: string;
  funcionario?: Funcionario;
}

export interface TicketAvulso {
  id: number;
  numero: string;
  nome: string;
  cpf: string;
}

export interface PedidoItem {
  id: number;
  tipo: string;
  tipo_texto: string;
  entregue: boolean;
  data_entrega: string | null;
  funcionario: string | null;
  cpf: string | null;
  ticket_numero: string | null;
  ticket_id: number | null;
  valor_unitario: number;
  valor_formatado: string;
  status_ticket: number;
  ticket_entregue: boolean;
  pode_entregar: boolean;
  status_ticket_texto: string;
}

export interface PedidoSimplificado {
  id: number;
  codigo_pedido: string;
  status: number;
  status_texto: string;
  status_cor: string;
  data_pedido: string;
  data_aceito?: string;
  data_pronto?: string;
  data_entregue?: string;
  data_recusado?: string;
  data_cancelado?: string;
  estabelecimento: {
    id: number;
    nome: string;
  };
  restaurante: {
    id: number;
    nome: string;
  };
  solicitante: {
    id: number;
    nome: string;
  };
  tipo_refeicao: string;
  quantidade_total: number;
  quantidade_normal: number;
  quantidade_avulsa: number;
  total_itens: number;
  observacoes?: string;
}

export interface Pedido {
  id: number;
  codigo_pedido: string;
  status: number;
  status_texto: string;
  status_cor: string;
  // ✅ IDs diretos para facilitar acesso (vindos do backend)
  id_restaurante: number;
  id_estabelecimento: number;
  id_tipo_refeicao: number;
  // Objetos aninhados para compatibilidade
  estabelecimento: {
    id: number;
    nome: string;
  };
  restaurante: {
    id: number;
    nome: string;
    logradouro?: string;
  };
  tipo_refeicao: string;
  quantidade_total: number;
  quantidade_normal: number;
  quantidade_avulsa: number;
  itens_entregues: number;
  itens_pendentes: number;
  valor_total: number;
  valor_total_formatado: string;
  observacoes?: string;
  data_pedido: string;
  data_aceito?: string;
  data_pronto?: string;
  data_entregue?: string;
  tempo_decorrido: string;
  solicitante: string;
  total_itens: number;
  itensPedido: PedidoItem[];
}

export interface CriarPedidoRequest {
  id_restaurante: number;
  id_tipo_refeicao: number;
  quantidade_normal?: number;
  quantidade_avulsa?: number;
  observacoes?: string;
}

export const TIPOS_REFEICAO = {
  1: "Café da Manhã",
  2: "Lanche",
  3: "Almoço",
  4: "Jantar",
} as const;

export interface PedidosFilters {
  status?: number;
  data_inicio?: string;
  data_fim?: string;
  id_restaurante?: number;
  id_estabelecimento?: number;
  id_tipo_refeicao?: number;
  codigo_pedido?: string;
  per_page?: number;
  page?: number;
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface PedidosListResponse {
  success: boolean;
  pedidos: PedidoSimplificado[];
  pagination: PaginationMeta;
}

export interface PedidoResponse {
  success: boolean;
  message?: string;
  pedido: Pedido;
  quota_restante?: number;
}

export interface CriarPedidoResponse {
  success: boolean;
  message: string;
  pedido: {
    id: number;
    codigo_pedido: string;
    status: number;
    status_texto: string;
    quantidade_total: number;
    quantidade_normal: number;
    quantidade_avulsa: number;
    valor_total: number;
    valor_total_formatado: string;
    tipo_refeicao: string;
    data_pedido: string;
  };
  quota_restante: number;
}

export interface QRCodeResponse {
  success: boolean;
  qr_code_data: string;
  codigo_pedido: string;
  estabelecimento?: string;
  message: string;
}

export interface QRScanResponse {
  success: boolean;
  message: string;
  pedido?: Pedido;
  qr_valido?: boolean;
  error?: string;
}

export interface EntregarItemFuncionarioRequest {
  funcionario_id: number;
  liberacao_id: number;
}

export interface EntregarItemAvulsoRequest {
  nome: string;
  cpf?: string;
  numero_ticket?: string;
  observacao?: string;
}

export const PEDIDO_STATUS = {
  PENDENTE: 1,
  ACEITO: 2,
  EM_PREPARO: 3,
  PRONTO: 4,
  ENTREGUE: 5,
  RECUSADO: 6,
  CANCELADO: 7,
} as const;

export const STATUS_LABELS = {
  [PEDIDO_STATUS.PENDENTE]: "Pendente",
  [PEDIDO_STATUS.ACEITO]: "Aceito",
  [PEDIDO_STATUS.EM_PREPARO]: "Em Preparo",
  [PEDIDO_STATUS.PRONTO]: "Pronto",
  [PEDIDO_STATUS.ENTREGUE]: "Entregue",
  [PEDIDO_STATUS.RECUSADO]: "Recusado",
  [PEDIDO_STATUS.CANCELADO]: "Cancelado",
} as const;

export const PEDIDO_STATUS_TEXTO = {
  1: "Pendente",
  2: "Aceito",
  3: "Em Preparo",
  4: "Pronto",
  5: "Entregue",
  6: "Recusado",
  7: "Cancelado",
} as const;

export type UserType =
  | "estabelecimento"
  | "restaurante"
  | "fornecedor"
  | "admin"
  | "indefinido";
