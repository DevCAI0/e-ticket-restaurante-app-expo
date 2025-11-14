// src/navigation/routes.ts
export const routes = {
  // Autenticação
  SIGN_IN: "SignIn",

  // Principal
  HOME: "Home",

  // Tickets
  SCANNER: "Scanner",
  MANUAL_VERIFICATION: "ManualVerification",
  TICKET_DETAILS: "TicketDetails",
  TICKETS_LIST: "TicketsList",
  BIOMETRIC_APPROVAL: "BiometricApproval",

  // Pedidos
  PEDIDOS: "Pedidos",
  PEDIDO_DETALHES: "PedidoDetalhes",
  CRIAR_PEDIDO: "CriarPedido",
  ADICIONAR_ITENS: "AdicionarItens",
  RECUSAR_PEDIDO: "RecusarPedido",
  CANCELAR_PEDIDO: "CancelarPedido",
  QR_CODE: "QRCode",
  QR_SCANNER: "QRScanner",
  ENTREGAR_ITENS: "EntregarItens",
  SCAN_TICKET_AVULSO: "ScanTicketAvulso",

  // Outros
  ORDERS: "Orders",
  SETTINGS: "Settings",
} as const; // ✅ Adicionar 'as const' aqui é CRUCIAL

export type RouteNames = (typeof routes)[keyof typeof routes];
