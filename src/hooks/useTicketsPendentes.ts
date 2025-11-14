import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encryptData, decryptData } from "../lib/crypto";
import { showErrorToast } from "../lib/toast";

interface Funcionario {
  id_funcionario: number | null;
  nome: string;
  cpf: string;
}

interface Ticket {
  id: number;
  numero: number;
  token_formatado: string;
  token: string;
  codigo?: string;
  funcionario: Funcionario;
  tipo_refeicao: string;
  valor: number;
  status: number;
  status_texto: string;
  data_emissao: string;
  data_cadastro?: string;
  data_validade?: string;
  expiracao?: string;
  tempo_restante: string;
  expirado?: boolean;
}

interface TicketPendente extends Ticket {
  adicionadoEm: string;
}

const STORAGE_KEY = "ticketsPendentes";

export function useTicketsPendentes() {
  const [ticketsPendentes, setTicketsPendentes] = useState<TicketPendente[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const carregarTickets = useCallback(async () => {
    try {
      const armazenado = await AsyncStorage.getItem(STORAGE_KEY);
      if (armazenado) {
        const tickets: TicketPendente[] = decryptData(armazenado);
        if (Array.isArray(tickets)) {
          const ticketsValidos = tickets.filter((ticket) => {
            if (!ticket.expiracao) {
              return false;
            }

            const dataExpiracao = new Date(ticket.expiracao);
            return dataExpiracao > new Date() && ticket.status !== 3;
          });

          setTicketsPendentes(ticketsValidos);

          if (ticketsValidos.length !== tickets.length) {
            const dadosCriptografados = encryptData(ticketsValidos);
            await AsyncStorage.setItem(STORAGE_KEY, dadosCriptografados);
          }
        }
      }
    } catch (error) {
      showErrorToast("Erro ao carregar tickets pendentes");
      await AsyncStorage.removeItem(STORAGE_KEY);
      setTicketsPendentes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTickets();
  }, [carregarTickets]);

  const salvarTickets = async (tickets: TicketPendente[]) => {
    try {
      const dadosCriptografados = encryptData(tickets);
      await AsyncStorage.setItem(STORAGE_KEY, dadosCriptografados);
    } catch (error) {
      showErrorToast("Erro ao salvar tickets");
    }
  };

  const adicionarTicket = useCallback(async (ticket: Ticket) => {
    if (ticket.status === 3) return;

    setTicketsPendentes((atual) => {
      if (atual.some((t) => t.id === ticket.id)) {
        return atual;
      }

      const novoTicket: TicketPendente = {
        ...ticket,
        adicionadoEm: new Date().toISOString(),
      };

      const novosTickets = [...atual, novoTicket];
      salvarTickets(novosTickets);
      return novosTickets;
    });
  }, []);

  const atualizarStatusTicket = useCallback(
    async (ticketId: number, novoStatus: number) => {
      setTicketsPendentes((atual) => {
        if (novoStatus === 3) {
          const novosTickets = atual.filter((t) => t.id !== ticketId);
          salvarTickets(novosTickets);
          return novosTickets;
        }

        const novosTickets = atual.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: novoStatus } : ticket
        );
        salvarTickets(novosTickets);
        return novosTickets;
      });
    },
    []
  );

  const removerTicket = useCallback(async (ticketId: number) => {
    setTicketsPendentes((atual) => {
      const novosTickets = atual.filter((t) => t.id !== ticketId);
      salvarTickets(novosTickets);
      return novosTickets;
    });
  }, []);

  const limparTickets = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setTicketsPendentes([]);
  }, []);

  const recarregarTickets = useCallback(async () => {
    setIsLoading(true);
    await carregarTickets();
  }, [carregarTickets]);

  return {
    ticketsPendentes,
    isLoading,
    adicionarTicket,
    atualizarStatusTicket,
    removerTicket,
    limparTickets,
    recarregarTickets,
  };
}
