import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../../components/common/Header";
import { BottomNav } from "../../components/common/BottomNav";
import { usePedidosPendentes } from "../../hooks/usePedidosPendentes";
import { RootStackParamList } from "../../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
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
  const [activeTab, setActiveTab] = useState("ajustes");

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

  const handleTabChange = (tab: string) => {
    console.log("⚙️ [SETTINGS] Mudando para tab:", tab);
    setActiveTab(tab);

    // Navegar para a tela correspondente
    if (tab === "home") {
      navigation.navigate("Home");
    } else if (tab === "pedidos") {
      markAsViewed();
      navigation.navigate("Pedidos");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onLogout={handleLogout} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nome || "Usuário"}</Text>
            <Text style={styles.profileDetail}>
              CPF: {user?.login || "---"}
            </Text>
            <Text style={styles.profileDetail}>
              Matrícula: {user?.login || "---"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistema</Text>

          <SettingItem
            icon="camera-outline"
            title="Permissões da Câmera"
            subtitle="Verificar e solicitar acesso à câmera"
            onPress={handleCameraPermissions}
          />
        </View>

        <View style={styles.section}>
          <SettingItem
            icon="log-out-outline"
            title="Sair da conta"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Versão 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 eTicket</Text>
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
    backgroundColor: colors.primaryLight + "20",
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
