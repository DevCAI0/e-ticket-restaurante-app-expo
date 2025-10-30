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

  // Other Routes
  ORDERS: "Orders",
  SETTINGS: "Settings",
} as const;

export type RouteNames = (typeof routes)[keyof typeof routes];
