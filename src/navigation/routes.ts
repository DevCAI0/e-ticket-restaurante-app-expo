// src/navigation/routes.ts
export const routes = {
  SIGN_IN: "SignIn",
  HOME: "Home",
  SCANNER: "Scanner",
  MANUAL_VERIFICATION: "ManualVerification",
  TICKET_DETAILS: "TicketDetails",
  BIOMETRIC_APPROVAL: "BiometricApproval",
  PEDIDOS: "Pedidos",
  PEDIDO_DETALHES: "PedidoDetalhes",
  CRIAR_PEDIDO: "CriarPedido",
  ADICIONAR_ITENS: "AdicionarItens",
  RECUSAR_PEDIDO: "RecusarPedido",
  CANCELAR_PEDIDO: "CancelarPedido",
  QR_CODE: "QRCode",
  QR_SCANNER: "QRScanner",
  ENTREGAR_ITENS: "EntregarItens",
  FACIAL_RECOGNITION: "FacialRecognition",
  ORDERS: "Orders",
  SETTINGS: "Settings",
} as const;

export type RouteNames = (typeof routes)[keyof typeof routes];
