// src/screens/ajustes/NotificacoesConfigScreen.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { useHorarioNotificacoes } from "../../hooks/useHorarioNotificacoes";

interface NotificacoesConfigScreenProps {
  navigation: any;
}

export function NotificacoesConfigScreen({
  navigation,
}: NotificacoesConfigScreenProps) {
  const {
    notificacoesAtivas,
    vozAtiva,
    ultimaVerificacao,
    ativarNotificacoes,
    desativarNotificacoes,
    ativarVoz,
    desativarVoz,
    testarNotificacao,
  } = useHorarioNotificacoes();

  const formatarDataHora = (data: Date | null) => {
    if (!data) return "Nunca";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações de Horário</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={24}
            color={colors.primary}
          />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>
              O sistema monitora automaticamente os horários disponíveis para
              criar pedidos. Quando um tipo de refeição fica disponível, você
              recebe uma notificação com aviso por voz.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Notificações Push</Text>
                <Text style={styles.settingDescription}>
                  Receba alertas quando horários ficarem disponíveis
                </Text>
              </View>
            </View>
            <Switch
              value={notificacoesAtivas}
              onValueChange={(value) =>
                value ? ativarNotificacoes() : desativarNotificacoes()
              }
              trackColor={{
                false: colors.border.light,
                true: colors.primary + "50",
              }}
              thumbColor={
                notificacoesAtivas ? colors.primary : colors.muted.light
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="volume-high" size={20} color={colors.success} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Assistente de Voz</Text>
                <Text style={styles.settingDescription}>
                  Ouvir mensagem falada junto com a notificação
                </Text>
              </View>
            </View>
            <Switch
              value={vozAtiva}
              onValueChange={(value) => (value ? ativarVoz() : desativarVoz())}
              trackColor={{
                false: colors.border.light,
                true: colors.success + "50",
              }}
              thumbColor={vozAtiva ? colors.success : colors.muted.light}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.muted.light}
            />
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>Última Verificação</Text>
              <Text style={styles.infoItemValue}>
                {formatarDataHora(ultimaVerificacao)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color={colors.muted.light}
            />
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>
                Frequência de Verificação
              </Text>
              <Text style={styles.infoItemValue}>A cada 1 minuto</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.muted.light}
            />
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>Intervalo de Notificação</Text>
              <Text style={styles.infoItemValue}>
                Notifica apenas a cada 5 minutos
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teste</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testarNotificacao}
          >
            <Ionicons
              name="play-circle"
              size={24}
              color={colors.background.light}
            />
            <Text style={styles.testButtonText}>Testar Notificação e Voz</Text>
          </TouchableOpacity>

          <Text style={styles.testHint}>
            Pressione para enviar uma notificação de teste com mensagem de voz
          </Text>
        </View>

        <View style={styles.exampleSection}>
          <Text style={styles.exampleTitle}>Exemplo de Notificação:</Text>
          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.exampleTime}>10:00</Text>
            </View>
            <Text style={styles.exampleNotifTitle}>
              ⏰ Horário Disponível - Almoço
            </Text>
            <Text style={styles.exampleNotifBody}>
              Você pode fazer pedidos de Almoço até 14:00.
            </Text>
            <View style={styles.exampleVoice}>
              <Ionicons name="volume-high" size={14} color={colors.success} />
              <Text style={styles.exampleVoiceText}>
                "Bom dia! Está disponível o horário para fazer pedido de Almoço.
                Válido até 14:00."
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.light,
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.primary + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  infoCardContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text.light,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.muted.light,
    lineHeight: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card.light,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 13,
    color: colors.muted.light,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.light,
  },
  testHint: {
    fontSize: 12,
    color: colors.muted.light,
    textAlign: "center",
    lineHeight: 16,
  },
  exampleSection: {
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 12,
  },
  exampleCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  exampleTime: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  exampleNotifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.light,
    marginBottom: 6,
  },
  exampleNotifBody: {
    fontSize: 13,
    color: colors.text.light,
    marginBottom: 12,
    lineHeight: 18,
  },
  exampleVoice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.success + "10",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  exampleVoiceText: {
    flex: 1,
    fontSize: 12,
    color: colors.success,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
