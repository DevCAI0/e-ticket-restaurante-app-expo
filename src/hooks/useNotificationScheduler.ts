// src/hooks/useNotificationScheduler.ts
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useProfilePermissions } from "./useProfilePermissions";
import { verificarEReagendarSeNecessario } from "../services/scheduledNotificationsService";

/**
 * Hook para agendar notificações automaticamente após login
 * Só agenda para usuários de ESTABELECIMENTO
 */
export function useNotificationScheduler() {
  const { isAuthenticated } = useAuth();
  const { isEstablishment } = useProfilePermissions();

  useEffect(() => {
    const agendarSeNecessario = async () => {
      // Só agendar se estiver autenticado E for estabelecimento
      if (isAuthenticated() && isEstablishment()) {
        console.log(
          "📅 [AUTO-SCHEDULER] Usuário autenticado como estabelecimento, agendando..."
        );

        try {
          await verificarEReagendarSeNecessario();
          console.log("✅ [AUTO-SCHEDULER] Notificações agendadas com sucesso");
        } catch (error) {
          console.error("❌ [AUTO-SCHEDULER] Erro ao agendar:", error);
        }
      } else {
        console.log(
          "⏭️ [AUTO-SCHEDULER] Usuário não é estabelecimento ou não está autenticado"
        );
      }
    };

    // Agendar com pequeno delay para garantir que auth está pronto
    const timer = setTimeout(agendarSeNecessario, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isEstablishment]);
}
