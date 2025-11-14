// src/services/notificationBackgroundService.ts
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PedidosAPI } from "../api/pedidos";

const BACKGROUND_NOTIFICATION_TASK = "background-notification-check";

interface TipoRefeicaoDisponivel {
  id: number;
  nome: string;
  disponivel_de: string;
  disponivel_ate: string;
}

// Definir a task em background
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log("🔄 [BACKGROUND] Verificando horários em background...");

    // Verificar se usuário está autenticado
    const token = await AsyncStorage.getItem("@eticket:token");
    const userStr = await AsyncStorage.getItem("@eticket:user");

    if (!token || !userStr) {
      console.log("⏭️ [BACKGROUND] Usuário não autenticado");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const user = JSON.parse(userStr);

    // Verificar se é estabelecimento
    if (user.id_restaurante) {
      console.log("⏭️ [BACKGROUND] Usuário não é estabelecimento");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Verificar cache de notificações já enviadas
    const cacheStr = await AsyncStorage.getItem("@eticket:notifications_cache");
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    const hoje = new Date().toISOString().split("T")[0];

    // Limpar cache de dias anteriores
    if (cache.data !== hoje) {
      cache.data = hoje;
      cache.notificados = [];
    }

    // Buscar horários disponíveis
    const response = await PedidosAPI.listarRestaurantesDisponiveis();

    if (!response.success || !response.data?.restaurantes) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const horaAtual = new Date();
    const tiposDisponiveis: TipoRefeicaoDisponivel[] = [];

    // Coletar tipos de refeição disponíveis
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

    let notificouAlgo = false;

    // Verificar cada tipo
    for (const tipo of tiposDisponiveis) {
      const horarioInicio = tipo.disponivel_de;
      if (!horarioInicio) continue;

      // Verificar se já notificou hoje
      const chave = `${tipo.id}-${horarioInicio}`;
      if (cache.notificados?.includes(chave)) {
        continue;
      }

      const [horaInicio, minutoInicio] = horarioInicio.split(":").map(Number);
      const inicioDate = new Date();
      inicioDate.setHours(horaInicio, minutoInicio, 0, 0);

      const diferencaMinutos = Math.floor(
        (horaAtual.getTime() - inicioDate.getTime()) / 60000
      );

      // Se estamos no horário (0 a 1 minuto após)
      if (diferencaMinutos >= 0 && diferencaMinutos <= 1) {
        console.log(`🎯 [BACKGROUND] Enviando notificação para ${tipo.nome}`);

        // Enviar notificação
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
          trigger: null,
        });

        // Marcar como notificado
        if (!cache.notificados) cache.notificados = [];
        cache.notificados.push(chave);
        notificouAlgo = true;

        console.log(`✅ [BACKGROUND] Notificação enviada para ${tipo.nome}`);
      }
    }

    // Salvar cache atualizado
    await AsyncStorage.setItem(
      "@eticket:notifications_cache",
      JSON.stringify(cache)
    );

    return notificouAlgo
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("❌ [BACKGROUND] Erro:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Registrar a task
export async function registerBackgroundNotifications() {
  try {
    console.log("📝 [BACKGROUND] Registrando background task...");

    // Verificar se já está registrado
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_NOTIFICATION_TASK
    );

    if (isRegistered) {
      console.log("✅ [BACKGROUND] Task já registrada");
      return;
    }

    // Registrar com intervalo de 15 minutos (mínimo permitido)
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 minutos em segundos
      stopOnTerminate: false, // Continuar após app fechar
      startOnBoot: true, // Iniciar ao ligar o dispositivo
    });

    console.log("✅ [BACKGROUND] Background task registrada com sucesso");
  } catch (error) {
    console.error("❌ [BACKGROUND] Erro ao registrar task:", error);
  }
}

// Cancelar a task
export async function unregisterBackgroundNotifications() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log("✅ [BACKGROUND] Background task cancelada");
  } catch (error) {
    console.error("❌ [BACKGROUND] Erro ao cancelar task:", error);
  }
}

// Verificar status
export async function getBackgroundTaskStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_NOTIFICATION_TASK
    );

    return {
      status,
      isRegistered,
      statusText:
        status === BackgroundFetch.BackgroundFetchStatus.Available
          ? "Disponível"
          : status === BackgroundFetch.BackgroundFetchStatus.Denied
            ? "Negado"
            : "Restrito",
    };
  } catch (error) {
    console.error("❌ [BACKGROUND] Erro ao verificar status:", error);
    return null;
  }
}
