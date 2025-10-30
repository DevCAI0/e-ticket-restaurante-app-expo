// src/hooks/useTickets.ts
import { useState, useEffect } from "react";
import { getItem, setItem, removeItem } from "../lib/storage";
import { encryptData, decryptData } from "../lib/crypto";
import { showErrorToast } from "../lib/toast";
import { Ticket } from "../api/tickets/ticketService";

interface TicketPendente extends Ticket {
  adicionadoEm: string;
}

const STORAGE_KEY = "ticketsPendentes";

export const useTickets = () => {
  const [ticketsPendentes, setTicketsPendentes] = useState<TicketPendente[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Carregar tickets do storage ao iniciar
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const stored = await getItem(STORAGE_KEY);

      if (stored) {
        const tickets: TicketPendente[] = decryptData(stored);

        if (Array.isArray(tickets)) {
          // Filtrar tickets válidos (não expirados e não aprovados)
          const validTickets = tickets.filter((ticket) => {
            if (!ticket.expiracao) return false;

            const expiration = new Date(ticket.expiracao);
            return expiration > new Date() && ticket.status !== 3;
          });

          setTicketsPendentes(validTickets);

          // Se removeu algum ticket, salvar novamente
          if (validTickets.length !== tickets.length) {
            await saveTickets(validTickets);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
      showErrorToast("Erro ao carregar tickets pendentes");
    } finally {
      setLoading(false);
    }
  };

  const saveTickets = async (tickets: TicketPendente[]) => {
    try {
      const encrypted = encryptData(tickets);
      await setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error("Erro ao salvar tickets:", error);
      showErrorToast("Erro ao salvar tickets");
    }
  };

  const adicionarTicket = async (ticket: Ticket) => {
    // Não adicionar se já foi aprovado
    if (ticket.status === 3) return;

    const ticketExists = ticketsPendentes.some((t) => t.id === ticket.id);
    if (ticketExists) return;

    const novoTicket: TicketPendente = {
      ...ticket,
      adicionadoEm: new Date().toISOString(),
    };

    const novosTickets = [...ticketsPendentes, novoTicket];
    setTicketsPendentes(novosTickets);
    await saveTickets(novosTickets);
  };

  const atualizarStatusTicket = async (
    ticketId: number,
    novoStatus: number
  ) => {
    let novosTickets: TicketPendente[];

    if (novoStatus === 3) {
      // Se aprovado, remover da lista
      novosTickets = ticketsPendentes.filter((t) => t.id !== ticketId);
    } else {
      // Atualizar status
      novosTickets = ticketsPendentes.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: novoStatus } : ticket
      );
    }

    setTicketsPendentes(novosTickets);
    await saveTickets(novosTickets);
  };

  const removerTicket = async (ticketId: number) => {
    const novosTickets = ticketsPendentes.filter((t) => t.id !== ticketId);
    setTicketsPendentes(novosTickets);
    await saveTickets(novosTickets);
  };

  const limparTickets = async () => {
    try {
      await removeItem(STORAGE_KEY);
      setTicketsPendentes([]);
    } catch (error) {
      console.error("Erro ao limpar tickets:", error);
    }
  };

  return {
    ticketsPendentes,
    loading,
    adicionarTicket,
    atualizarStatusTicket,
    removerTicket,
    limparTickets,
  };
};
