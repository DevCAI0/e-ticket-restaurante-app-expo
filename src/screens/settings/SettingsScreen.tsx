// src/screens/SettingsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../../components/common/Header";
import { BottomNav } from "../../components/common/BottomNav";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  usePushNotifications,
  useTestNotification,
} from "../../hooks/usePushNotifications";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress}
      disabled={disabled || (!onPress && !rightElement)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, danger && styles.iconDanger]}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? colors.destructive.light : colors.text.light}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, danger && styles.textDanger]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.muted.light} />
      ) : null}
    </TouchableOpacity>
  );
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const {
    count: pedidosPendentes,
    hasNewOrders,
    markAsViewed,
  } = usePedidosPendentes();

  const { expoPushToken, registerForPushNotifications } =
    usePushNotifications();

  const { sendTestNotification, isSending } = useTestNotification();

  const [activeTab, setActiveTab] = useState("ajustes");
  const [notificationStatus, setNotificationStatus] =
    useState<string>("Verificando...");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDevToken, setIsDevToken] = useState(false);

  useEffect(() => {
    if (user) {
      verificarStatusNotificacoes();
      if (!expoPushToken) {
        tryAutoRegister();
      }
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (expoPushToken) {
      const isDev =
        expoPushToken.includes("[dev-") ||
        expoPushToken.includes("[development-");
      setIsDevToken(isDev);
    }
  }, [expoPushToken]);

  const tryAutoRegister = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        await registerForPushNotifications();
      }
    } catch (error) {
      console.log("Erro ao tentar registro automático:", error);
    }
  };

  const verificarStatusNotificacoes = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        setNotificationStatus(expoPushToken ? "Ativas" : "Ativando...");
      } else if (status === "denied") {
        setNotificationStatus("Negadas");
      } else {
        setNotificationStatus("Não solicitadas");
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setNotificationStatus("Erro");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleCameraPermissions = () => {
    Alert.alert(
      "Permissões da Câmera",
      "As permissões da câmera são gerenciadas nas configurações do sistema.",
      [{ text: "OK" }]
    );
  };

  const handleNotificationPermissions = async () => {
    if (isRegistering) return;

    try {
      setIsRegistering(true);
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      if (existingStatus === "granted") {
        if (expoPushToken) {
          Alert.alert(
            "Notificações Ativas",
            "As notificações já estão ativadas!",
            [{ text: "OK" }]
          );
        } else {
          await registerForPushNotifications();
          await verificarStatusNotificacoes();
          Alert.alert(
            "Token Registrado",
            "Token de notificação registrado com sucesso!",
            [{ text: "OK" }]
          );
        }
        return;
      }

      if (existingStatus === "denied") {
        Alert.alert(
          "Permissão Negada",
          "Você negou as permissões de notificação anteriormente. Para ativar, vá em:\n\nConfigurações > Apps > E-Ticket > Notificações",
          [{ text: "OK" }]
        );
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === "granted") {
        await registerForPushNotifications();
        await verificarStatusNotificacoes();
        Alert.alert(
          "Permissão Concedida!",
          "Notificações ativadas com sucesso!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Permissão Negada", "Você não receberá notificações push.");
      }

      await verificarStatusNotificacoes();
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      Alert.alert("Erro", "Falha ao solicitar permissões de notificação.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert(
        "Token não registrado",
        "Primeiro ative as notificações para testar.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isDevToken) {
      Alert.alert(
        "Token de Desenvolvimento",
        "Você está usando um token de desenvolvimento.\n\nNotificações remotas só funcionam com builds de produção.\n\nUse: eas build --profile preview --platform android",
        [{ text: "OK" }]
      );
      return;
    }

    const success = await sendTestNotification();

    if (success) {
      Alert.alert(
        "Notificação Enviada!",
        "Você deve receber uma notificação de teste em alguns segundos.",
        [{ text: "OK" }]
      );
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    if (tab === "home") {
      navigation.navigate("Home");
    } else if (tab === "pedidos") {
      markAsViewed();
      navigation.navigate("Pedidos");
    }
  };

  const getStatusColor = () => {
    switch (notificationStatus) {
      case "Ativas":
        return colors.success;
      case "Negadas":
        return colors.destructive.light;
      case "Ativando...":
        return "#f59e0b";
      default:
        return colors.muted.light;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onLogout={handleLogout} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.nome || "Usuário"}</Text>
            <Text style={styles.profileDetail}>
              Login: {user.login || "---"}
            </Text>
            {user.id_estabelecimento && (
              <Text style={styles.profileDetail}>Estabelecimento</Text>
            )}
            {user.id_restaurante && (
              <Text style={styles.profileDetail}>Restaurante</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações Push</Text>

          <SettingItem
            icon="notifications-outline"
            title="Status das Notificações"
            subtitle={notificationStatus}
            onPress={handleNotificationPermissions}
            disabled={isRegistering}
            rightElement={
              isRegistering ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor() },
                    ]}
                  />
                </View>
              )
            }
          />

          <SettingItem
            icon="send-outline"
            title="Testar Notificação"
            subtitle="Enviar notificação de teste"
            onPress={handleTestNotification}
            disabled={!expoPushToken || isSending}
            rightElement={
              isSending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : null
            }
          />

          {__DEV__ && expoPushToken && (
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenLabel}>Token (DEV):</Text>
              <Text style={styles.tokenText} numberOfLines={1}>
                {expoPushToken.substring(0, 40)}...
              </Text>
              {isDevToken && (
                <View style={styles.devWarning}>
                  <Ionicons name="warning" size={16} color="#f59e0b" />
                  <Text style={styles.devWarningText}>
                    Token de desenvolvimento - Use testador local ou EAS build
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissões</Text>

          <SettingItem
            icon="camera-outline"
            title="Permissões da Câmera"
            subtitle="Verificar e solicitar acesso à câmera"
            onPress={handleCameraPermissions}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <SettingItem
            icon="log-out-outline"
            title="Sair da conta"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>E-Ticket Restaurante</Text>
          <Text style={styles.footerText}>Versão 1.0.3</Text>
          <Text style={styles.footerText}>© 2024</Text>
        </View>
      </ScrollView>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pedidosPendentes={pedidosPendentes}
        hasNewOrders={hasNewOrders}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 13,
    color: colors.muted.light,
    marginTop: 2,
  },
  section: {
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted.light,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconDanger: {
    backgroundColor: colors.destructive.light + "10",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.light,
  },
  textDanger: {
    color: colors.destructive.light,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.muted.light,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tokenInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted.light,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  tokenText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.text.light,
  },
  devWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    gap: 6,
  },
  devWarningText: {
    flex: 1,
    fontSize: 11,
    color: "#92400e",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 4,
  },
});
