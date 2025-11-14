// src/services/scheduledNotificationsService.ts
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PedidosAPI } from "../api/pedidos";

const STORAGE_KEY = "@eticket:scheduled_notifications";

interface ScheduledNotificationData {
  id: string;
  tipo_refeicao_id: number;
  nome: string;
  horario: string;
  data: string;
}

/**
 * Agendar notificações para os próximos horários disponíveis
 * Esta função deve ser chamada:
 * 1. Quando o usuário abre o app
 * 2. Quando faz login
 * 3. Uma vez por dia (pode usar background task diário)
 */
export async function agendarNotificacoesDoProximoDia() {
  try {
    console.log("📅 [SCHEDULER] Agendando notificações do próximo dia...");

    // Limpar notificações antigas
    await cancelarTodasNotificacoesAgendadas();

    // Buscar horários disponíveis
    const response = await PedidosAPI.listarRestaurantesDisponiveis();

    if (!response.success || !response.data?.restaurantes) {
      console.log("⚠️ [SCHEDULER] Nenhum restaurante disponível");
      return;
    }

    const hoje = new Date();
    const tiposDisponiveis = new Map();

    // Coletar todos os tipos de refeição únicos
    response.data.restaurantes.forEach((restaurante: any) => {
      if (restaurante.tipos_refeicao_disponiveis) {
        restaurante.tipos_refeicao_disponiveis.forEach((tipo: any) => {
          if (!tiposDisponiveis.has(tipo.id)) {
            tiposDisponiveis.set(tipo.id, {
              id: tipo.id,
              nome: tipo.nome,
              disponivel_de: tipo.disponivel_de || tipo.horario_inicio,
              disponivel_ate: tipo.disponivel_ate || tipo.horario_fim,
            });
          }
        });
      }
    });

    const notificacoesAgendadas: ScheduledNotificationData[] = [];

    // Agendar notificação para cada tipo
    for (const [_, tipo] of tiposDisponiveis) {
      const horario = tipo.disponivel_de;
      if (!horario) continue;

      const [hora, minuto] = horario.split(":").map(Number);

      // Agendar para hoje (se ainda não passou)
      const dataNotificacaoHoje = new Date();
      dataNotificacaoHoje.setHours(hora, minuto, 0, 0);

      if (dataNotificacaoHoje > hoje) {
        // Calcular segundos até o horário
        const segundosAteNotificacao = Math.floor(
          (dataNotificacaoHoje.getTime() - hoje.getTime()) / 1000
        );

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Horário Disponível - ${tipo.nome}`,
            body: `Você pode fazer pedidos de ${tipo.nome} até ${tipo.disponivel_ate}.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: {
              tipo: "horario_disponivel",
              tipo_refeicao_id: tipo.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: segundosAteNotificacao,
          },
        });

        notificacoesAgendadas.push({
          id: notificationId,
          tipo_refeicao_id: tipo.id,
          nome: tipo.nome,
          horario: horario,
          data: dataNotificacaoHoje.toISOString(),
        });

        console.log(
          `✅ [SCHEDULER] Agendado: ${tipo.nome} às ${horario} (hoje)`
        );
      }

      // Agendar para amanhã
      const dataNotificacaoAmanha = new Date();
      dataNotificacaoAmanha.setDate(dataNotificacaoAmanha.getDate() + 1);
      dataNotificacaoAmanha.setHours(hora, minuto, 0, 0);

      // Calcular segundos até amanhã
      const segundosAteAmanha = Math.floor(
        (dataNotificacaoAmanha.getTime() - hoje.getTime()) / 1000
      );

      const notificationIdAmanha =
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Horário Disponível - ${tipo.nome}`,
            body: `Você pode fazer pedidos de ${tipo.nome} até ${tipo.disponivel_ate}.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: {
              tipo: "horario_disponivel",
              tipo_refeicao_id: tipo.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: segundosAteAmanha,
          },
        });

      notificacoesAgendadas.push({
        id: notificationIdAmanha,
        tipo_refeicao_id: tipo.id,
        nome: tipo.nome,
        horario: horario,
        data: dataNotificacaoAmanha.toISOString(),
      });

      console.log(
        `✅ [SCHEDULER] Agendado: ${tipo.nome} às ${horario} (amanhã)`
      );
    }

    // Salvar lista de notificações agendadas
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notificacoesAgendadas)
    );

    console.log(
      `✅ [SCHEDULER] Total agendado: ${notificacoesAgendadas.length} notificações`
    );

    return notificacoesAgendadas;
  } catch (error) {
    console.error("❌ [SCHEDULER] Erro ao agendar notificações:", error);
    throw error;
  }
}

/**
 * Cancelar todas as notificações agendadas
 */
export async function cancelarTodasNotificacoesAgendadas() {
  try {
    console.log("🗑️ [SCHEDULER] Cancelando notificações antigas...");

    // Obter notificações salvas
    const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedStr) {
      const saved: ScheduledNotificationData[] = JSON.parse(savedStr);

      // Cancelar cada uma
      for (const notif of saved) {
        await Notifications.cancelScheduledNotificationAsync(notif.id);
      }

      console.log(`✅ [SCHEDULER] Canceladas ${saved.length} notificações`);
    }

    // Limpar armazenamento
    await AsyncStorage.removeItem(STORAGE_KEY);

    // Cancelar todas as notificações agendadas (garantia extra)
    await Notifications.cancelAllScheduledNotificationsAsync();

    console.log("✅ [SCHEDULER] Limpeza concluída");
  } catch (error) {
    console.error("❌ [SCHEDULER] Erro ao cancelar notificações:", error);
  }
}

/**
 * Listar notificações agendadas
 */
export async function listarNotificacoesAgendadas(): Promise<
  ScheduledNotificationData[]
> {
  try {
    const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedStr) {
      return JSON.parse(savedStr);
    }
    return [];
  } catch (error) {
    console.error("❌ [SCHEDULER] Erro ao listar notificações:", error);
    return [];
  }
}

/**
 * Verificar e re-agendar se necessário
 * Chamar isso quando o app abre
 */
export async function verificarEReagendarSeNecessario() {
  try {
    const agendadas = await listarNotificacoesAgendadas();

    // Se não tem notificações agendadas ou se a última é de ontem
    if (agendadas.length === 0) {
      console.log("📅 [SCHEDULER] Nenhuma notificação agendada, agendando...");
      await agendarNotificacoesDoProximoDia();
      return;
    }

    // Verificar se precisa re-agendar
    const hoje = new Date().toISOString().split("T")[0];
    const ultimaAgendada = agendadas[agendadas.length - 1];
    const dataUltima = ultimaAgendada.data.split("T")[0];

    if (dataUltima < hoje) {
      console.log(
        "📅 [SCHEDULER] Notificações desatualizadas, re-agendando..."
      );
      await agendarNotificacoesDoProximoDia();
    } else {
      console.log("✅ [SCHEDULER] Notificações já agendadas para hoje/amanhã");
    }
  } catch (error) {
    console.error("❌ [SCHEDULER] Erro ao verificar:", error);
  }
}
