// src/hooks/usePedidosPendentes.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { listarPedidos } from "../api/pedidos";

export function usePedidosPendentes() {
  const { user, isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Refs para evitar loops infinitos
  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkPedidosPendentes = useCallback(async () => {
    if (!isAuthenticated() || !user) {
      setCount(0);
      setHasNewOrders(false);
      return;
    }

    try {
      const response = await listarPedidos({
        status: 1, // PEDIDO_STATUS.PENDENTE = 1
        per_page: 100,
      });

      if (response.success && response.pedidos && isMounted.current) {
        const pendentesCount = response.pedidos.length;

        // Se houver mais pedidos que antes, marca como "novos"
        if (lastCheck && pendentesCount > count) {
          setHasNewOrders(true);
        }

        setCount(pendentesCount);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error("Erro ao verificar pedidos pendentes:", error);
    }
  }, [isAuthenticated, user]); // ❌ REMOVIDO count e lastCheck das dependências

  // Verifica a cada 30 segundos
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isAuthenticated()) {
      // Primeira verificação
      checkPedidosPendentes();

      // Configurar intervalo
      intervalRef.current = setInterval(() => {
        checkPedidosPendentes();
      }, 30000); // 30 segundos
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]); // ❌ REMOVIDO checkPedidosPendentes das dependências

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const markAsViewed = useCallback(() => {
    setHasNewOrders(false);
  }, []);

  return {
    count,
    hasNewOrders,
    markAsViewed,
    refresh: checkPedidosPendentes,
  };
}
