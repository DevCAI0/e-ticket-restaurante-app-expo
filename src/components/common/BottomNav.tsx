// src/components/common/BottomNav.tsx - Atualizado com permissões e safe area
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { useProfilePermissions } from "../../hooks/useProfilePermissions";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  showBadge?: boolean;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pedidosPendentes?: number;
  hasNewOrders?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pedidosPendentes = 0,
  hasNewOrders = false,
}) => {
  const insets = useSafeAreaInsets();
  const {
    isEstablishment,
    hasProfile,
    canAccessTickets,
    canAccessNotes,
    canAccessOrders,
  } = useProfilePermissions();

  const navItems = useMemo<NavItem[]>(() => {
    // Para usuários com id_perfil = 1 (estabelecimento), mostrar apenas Home, Pedidos e Ajustes
    if (isEstablishment()) {
      return [
        {
          id: "home",
          icon: "home",
          label: "Home",
        },
        {
          id: "pedidos",
          icon: "cart-outline",
          label: "Pedidos",
          showBadge: true,
        },
        {
          id: "ajustes",
          icon: "settings-outline",
          label: "Ajustes",
        },
      ];
    }

    // Para perfil 2 (restaurante operador), mostrar sem notas
    if (hasProfile(2)) {
      return [
        {
          id: "home",
          icon: "home",
          label: "Home",
        },
        {
          id: "tickets",
          icon: "ticket-outline",
          label: "Tickets",
        },
        {
          id: "pedidos",
          icon: "cart-outline",
          label: "Pedidos",
          showBadge: true,
        },
        {
          id: "ajustes",
          icon: "settings-outline",
          label: "Ajustes",
        },
      ];
    }

    // Para perfil 3 (gerente restaurante), mostrar menu completo incluindo notas
    const items: NavItem[] = [
      {
        id: "home",
        icon: "home",
        label: "Home",
      },
    ];

    if (canAccessTickets()) {
      items.push({
        id: "tickets",
        icon: "ticket-outline",
        label: "Tickets",
      });
    }

    if (canAccessNotes()) {
      items.push({
        id: "notas",
        icon: "document-text-outline",
        label: "Notas",
      });
    }

    if (canAccessOrders()) {
      items.push({
        id: "pedidos",
        icon: "cart-outline",
        label: "Pedidos",
        showBadge: true,
      });
    }

    items.push({
      id: "ajustes",
      icon: "settings-outline",
      label: "Ajustes",
    });

    return items;
  }, [
    isEstablishment,
    hasProfile,
    canAccessTickets,
    canAccessNotes,
    canAccessOrders,
  ]);

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const shouldShowBadge =
          item.showBadge === true &&
          hasNewOrders &&
          activeTab !== "pedidos" &&
          pedidosPendentes > 0;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onTabChange(item.id)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.muted.light}
              />
              {shouldShowBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pedidosPendentes > 99 ? "99+" : pedidosPendentes}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    position: "relative",
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    color: colors.muted.light,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
