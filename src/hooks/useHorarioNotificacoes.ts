// src/hooks/useHorarioNotificacoes.ts
import { useState, useEffect, useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import * as Notifications from "expo-notifications";
import { useAuth } from "./useAuth";
import { useProfilePermissions } from "./useProfilePermissions";
import { PedidosAPI } from "../api/pedidos";

interface TipoRefeicaoDisponivel {
  id: number;
  nome: string;
  disponivel_de: string;
  disponivel_ate: string;
}

interface HorarioNotificacao {
  tipo_refeicao_id: number;
  nome: string;
  horario_inicio: string;
  ja_notificado: boolean;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useHorarioNotificacoes() {
  const { user, isAuthenticated } = useAuth();
  const { isEstablishment } = useProfilePermissions();
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [vozAtiva, setVozAtiva] = useState(true);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<Date | null>(null);

  const notificacoesRegistradas = useRef<Map<number, HorarioNotificacao>>(
    new Map()
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const isEstabelecimento = isEstablishment();

  const falarTexto = useCallback(
    async (texto: string) => {
      if (!vozAtiva) return;

      try {
        await Speech.stop();
        await Speech.speak(texto, {
          language: "pt-BR",
          pitch: 1.0,
          rate: 0.9,
        });
      } catch (error) {
        console.error("Erro ao falar texto:", error);
      }
    },
    [vozAtiva]
  );

  const enviarNotificacaoLocal = useCallback(
    async (titulo: string, corpo: string, dados?: any) => {
      if (!notificacoesAtivas) return;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: titulo,
            body: corpo,
            sound: true,
            data: dados || {},
          },
          trigger: null,
        });
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }
    },
    [notificacoesAtivas]
  );

  const obterSaudacao = useCallback((): string => {
    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) {
      return "Bom dia";
    } else if (hora >= 12 && hora < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  }, []);

  const verificarHorariosDisponiveis = useCallback(async () => {
    if (!isAuthenticated() || !user || !isEstabelecimento) {
      return;
    }

    try {
      const response = await PedidosAPI.listarRestaurantesDisponiveis();

      if (!response.success || !response.data?.restaurantes) {
        return;
      }

      const horaAtual = new Date();
      const minutos = horaAtual.getMinutes();

      if (minutos % 5 !== 0) {
        return;
      }

      const tiposDisponiveis: TipoRefeicaoDisponivel[] = [];

      response.data.restaurantes.forEach((restaurante: any) => {
        if (restaurante.tipos_refeicao_disponiveis) {
          restaurante.tipos_refeicao_disponiveis.forEach((tipo: any) => {
            if (!tiposDisponiveis.find((t) => t.id === tipo.id)) {
              tiposDisponiveis.push({
                id: tipo.id,
                nome: tipo.nome,
                disponivel_de: tipo.disponivel_de || tipo.horario_inicio,
                disponivel_ate: tipo.disponivel_ate || tipo.horario_fim,
              });
            }
          });
        }
      });

      for (const tipo of tiposDisponiveis) {
        const horarioInicio = tipo.disponivel_de;
        if (!horarioInicio) continue;

        const [horaInicio, minutoInicio] = horarioInicio.split(":").map(Number);
        const inicioDate = new Date();
        inicioDate.setHours(horaInicio, minutoInicio, 0, 0);

        const diferencaMinutos = Math.floor(
          (horaAtual.getTime() - inicioDate.getTime()) / 60000
        );

        if (
          diferencaMinutos >= 0 &&
          diferencaMinutos <= 5 &&
          !notificacoesRegistradas.current.has(tipo.id)
        ) {
          notificacoesRegistradas.current.set(tipo.id, {
            tipo_refeicao_id: tipo.id,
            nome: tipo.nome,
            horario_inicio: horarioInicio,
            ja_notificado: true,
          });

          const saudacao = obterSaudacao();
          const mensagemVoz = `${saudacao}! Está disponível o horário para fazer pedido de ${tipo.nome}. Válido até ${tipo.disponivel_ate}.`;
          const tituloNotificacao = `⏰ Horário Disponível - ${tipo.nome}`;
          const corpoNotificacao = `Você pode fazer pedidos de ${tipo.nome} até ${tipo.disponivel_ate}.`;

          await enviarNotificacaoLocal(tituloNotificacao, corpoNotificacao, {
            tipo_refeicao_id: tipo.id,
            tipo_refeicao_nome: tipo.nome,
            horario_inicio: horarioInicio,
            horario_fim: tipo.disponivel_ate,
          });

          setTimeout(() => {
            falarTexto(mensagemVoz);
          }, 1000);

          console.log(`✅ Notificação enviada para ${tipo.nome}`);
        }
      }

      setUltimaVerificacao(new Date());
    } catch (error) {
      console.error("Erro ao verificar horários disponíveis:", error);
    }
  }, [
    isAuthenticated,
    user,
    isEstabelecimento,
    falarTexto,
    enviarNotificacaoLocal,
    obterSaudacao,
  ]);

  const limparNotificacoesAntigas = useCallback(() => {
    const horaAtual = new Date().getHours();

    notificacoesRegistradas.current.forEach((notif, key) => {
      const [horaInicio] = notif.horario_inicio.split(":").map(Number);

      if (horaAtual > horaInicio + 1 || horaAtual < horaInicio) {
        notificacoesRegistradas.current.delete(key);
      }
    });
  }, []);

  useEffect(() => {
    const configurarPermissoes = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Permissão de notificação não concedida");
        setNotificacoesAtivas(false);
      }
    };

    configurarPermissoes();
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isAuthenticated() && user && isEstabelecimento) {
      verificarHorariosDisponiveis();

      intervalRef.current = setInterval(() => {
        verificarHorariosDisponiveis();
        limparNotificacoesAntigas();
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isAuthenticated,
    user,
    isEstabelecimento,
    verificarHorariosDisponiveis,
    limparNotificacoesAntigas,
  ]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Speech.stop();
    };
  }, []);

  const desativarNotificacoes = useCallback(() => {
    setNotificacoesAtivas(false);
  }, []);

  const ativarNotificacoes = useCallback(() => {
    setNotificacoesAtivas(true);
  }, []);

  const desativarVoz = useCallback(() => {
    setVozAtiva(false);
    Speech.stop();
  }, []);

  const ativarVoz = useCallback(() => {
    setVozAtiva(true);
  }, []);

  const testarNotificacao = useCallback(async () => {
    const saudacao = obterSaudacao();
    const mensagem = `${saudacao}! Esta é uma notificação de teste do sistema de pedidos.`;

    await enviarNotificacaoLocal(
      "🔔 Teste de Notificação",
      "Sistema de notificações funcionando corretamente!",
      { tipo: "teste" }
    );

    setTimeout(() => {
      falarTexto(mensagem);
    }, 500);
  }, [obterSaudacao, enviarNotificacaoLocal, falarTexto]);

  return {
    notificacoesAtivas,
    vozAtiva,
    ultimaVerificacao,
    desativarNotificacoes,
    ativarNotificacoes,
    desativarVoz,
    ativarVoz,
    testarNotificacao,
    verificarHorariosDisponiveis,
  };
}
