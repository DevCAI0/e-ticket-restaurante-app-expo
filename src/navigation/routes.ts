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

  // Outros
  ORDERS: "Orders",
  SETTINGS: "Settings",
} as const;

export type RouteNames = (typeof routes)[keyof typeof routes];
