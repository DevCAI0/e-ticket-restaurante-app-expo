// src/hooks/useTicketsList.ts
import { useState, useEffect, useCallback } from "react";
import {
  TicketItem,
  buscarTicketsRestaurante,
} from "../api/tickets/ticketsListService";
import { useAuth } from "./useAuth";
import { showErrorToast } from "../lib/toast";

export function useTicketsList() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTickets = useCallback(
    async (pageNumber = 1) => {
      if (!user?.id_restaurante) {
        setError("Usuário não está associado a um restaurante");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await buscarTicketsRestaurante(
          user.id_restaurante,
          pageNumber
        );

        if (!response.success) {
          throw new Error("Falha na resposta da API");
        }

        const ticketsData = response.tickets || [];

        if (!Array.isArray(ticketsData)) {
          throw new Error("Formato de dados inválido recebido da API");
        }

        if (pageNumber === 1) {
          setTickets(ticketsData);
        } else {
          setTickets((prev) => [...prev, ...ticketsData]);
        }

        setTotal(response.total || 0);

        const perPage = 15;
        setHasMore(ticketsData.length === perPage);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Falha ao carregar os tickets. Tente novamente.";

        setError(errorMessage);
        showErrorToast(errorMessage);

        if (pageNumber === 1) {
          setTickets([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id_restaurante]
  );

  useEffect(() => {
    if (user?.id_restaurante) {
      fetchTickets(1);
    }
  }, [user?.id_restaurante, fetchTickets]);

  const loadMoreTickets = async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchTickets(nextPage);
    }
  };

  const refreshTickets = async () => {
    setPage(1);
    setHasMore(true);
    await fetchTickets(1);
  };

  return {
    tickets,
    loading,
    hasMore,
    error,
    total,
    loadMoreTickets,
    refreshTickets,
  };
}
