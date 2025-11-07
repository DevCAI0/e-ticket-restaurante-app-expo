// src/hooks/usePedidosPendentes.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { PedidosAPI } from "../api/pedidos";

export function usePedidosPendentes() {
  const { user, isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Refs para evitar loops infinitos
  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0); // ✅ Usar ref ao invés de state no useCallback

  const checkPedidosPendentes = useCallback(async () => {
    if (!isAuthenticated() || !user) {
      setCount(0);
      setHasNewOrders(false);
      return;
    }

    try {
      const response = await PedidosAPI.listarPedidos({
        status: 1, // PEDIDO_STATUS.PENDENTE = 1
        per_page: 100,
      });

      if (response.success && response.pedidos && isMounted.current) {
        const pendentesCount = response.pedidos.length;

        // Se houver mais pedidos que antes, marca como "novos"
        if (pendentesCount > lastCountRef.current) {
          setHasNewOrders(true);
        }

        lastCountRef.current = pendentesCount;
        setCount(pendentesCount);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error("Erro ao verificar pedidos pendentes:", error);
      // ✅ Não fazer nada em caso de erro - manter contadores
    }
  }, [isAuthenticated, user]);

  // Verifica a cada 30 segundos
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isAuthenticated() && user) {
      // Primeira verificação
      checkPedidosPendentes();

      // Configurar intervalo
      intervalRef.current = setInterval(() => {
        checkPedidosPendentes();
      }, 30000); // 30 segundos
    } else {
      // Se não autenticado, zerar contadores
      setCount(0);
      setHasNewOrders(false);
      lastCountRef.current = 0;
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, user, checkPedidosPendentes]);

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
