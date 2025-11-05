// src/navigation/routes.ts

export const routes = {
  // Auth Routes
  SIGN_IN: "SignIn",

  // Main Routes
  HOME: "Home",

  // Ticket Routes
  SCANNER: "Scanner",
  MANUAL_VERIFICATION: "ManualVerification",
  TICKET_DETAILS: "TicketDetails",

  // Biometric Routes
  BIOMETRIC_APPROVAL: "BiometricApproval",

  // Pedidos Routes
  PEDIDOS: "Pedidos",
  PEDIDO_DETALHES: "PedidoDetalhes",
  CRIAR_PEDIDO: "CriarPedido",
  ADICIONAR_ITENS: "AdicionarItens",
  RECUSAR_PEDIDO: "RecusarPedido",
  CANCELAR_PEDIDO: "CancelarPedido",
  QR_CODE: "QRCode",
  QR_SCANNER: "QRScanner",
  ENTREGAR_FUNCIONARIO: "EntregarFuncionario",

  // Other Routes
  ORDERS: "Orders",
  SETTINGS: "Settings",
} as const;

export type RouteNames = (typeof routes)[keyof typeof routes];
