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

export interface RestauranteDisponivel {
  id: number;
  nome: string;
  logradouro?: string;
  id_estabelecimento: number;
  tipos_refeicao_disponiveis: TipoRefeicaoDisponivel[];
}

export interface TipoRefeicaoDisponivel {
  id: number;
  nome: string;
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

export interface AdicionarItensRequest {
  tickets: string[];
  observacoes?: string;
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
  numero_ticket: string;
  tipo_ticket: "normal" | "avulso";
  id_ticket?: number;
  id_ticket_avulso?: number;
  id_tipo_refeicao: number;
  nome_funcionario: string;
  cpf_funcionario: string;
  valor_unitario: number;
  quantidade: number;
  tipoRefeicao?: TipoRefeicao;
  ticket?: Ticket;
  ticketAvulso?: TicketAvulso;
}

export interface PedidoSimplificado {
  id: number;
  codigo_pedido: string;
  status: number;
  status_texto: string;
  data_pedido: string;
  data_aceito?: string;
  data_em_preparo?: string;
  data_pronto?: string;
  data_entregue?: string;
  data_recusado?: string;
  data_cancelado?: string;
  observacoes?: string;
  quantidade_total: number;
  valor_total: string;
  estabelecimento: Estabelecimento;
  restaurante: Restaurante;
  solicitante: Usuario;
  total_itens: number;
  motivo_recusa?: string;
  metodo_entrega?: "qr_code" | "codigo_manual";
  qr_code_usado_em?: string;
}

export interface Pedido extends PedidoSimplificado {
  usuarioSolicitante: Usuario;
  usuarioAceito?: Usuario;
  usuarioEmPreparo?: Usuario;
  usuarioRecusado?: Usuario;
  usuarioPronto?: Usuario;
  usuarioEntregue?: Usuario;
  usuarioCancelado?: Usuario;
  itensPedido: PedidoItem[];
  qr_code_data?: string;
}

export interface CriarPedidoRequest {
  id_restaurante: number;
  tickets: string[];
  observacoes?: string;
}

export const TIPOS_REFEICAO = {
  1: "Café",
  2: "Lanche",
  3: "Almoço",
  4: "Jantar",
} as const;

export interface BuscarTicketsRequest {
  numeros_tickets: string[];
  id_restaurante: number;
}

export interface TicketDisponivel {
  numero: string;
  tipo: "normal" | "avulso";
  encontrado: boolean;
  ticket_id?: number;
  empresa_id?: number;
  funcionario_nome?: string;
  funcionario_cpf?: string;
  tipo_refeicao?: string;
  valor?: number;
  valor_formatado?: string;
  erro?: string;
}

export interface PedidosFilters {
  status?: number;
  data_inicio?: string;
  data_fim?: string;
  id_restaurante?: number;
  id_estabelecimento?: number;
  codigo_pedido?: string;
  apenas_hoje?: boolean;
  apenas_pendentes?: boolean;
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
}

export const PEDIDO_STATUS = {
  PENDENTE: 1,
  EM_PREPARO: 3,
  PRONTO: 4,
  ENTREGUE: 5,
  RECUSADO: 6,
  CANCELADO: 7,
} as const;

export const STATUS_LABELS = {
  [PEDIDO_STATUS.PENDENTE]: "Pendente",
  [PEDIDO_STATUS.EM_PREPARO]: "Em Preparo",
  [PEDIDO_STATUS.PRONTO]: "Pronto",
  [PEDIDO_STATUS.ENTREGUE]: "Entregue",
  [PEDIDO_STATUS.RECUSADO]: "Recusado",
  [PEDIDO_STATUS.CANCELADO]: "Cancelado",
} as const;

export const PEDIDO_STATUS_TEXTO = {
  1: "Pendente",
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
