// src/components/common/BottomNav.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: "home", icon: "home", label: "Home" },
    { id: "tickets", icon: "ticket-outline", label: "Tickets" },
    { id: "pedidos", icon: "cart-outline", label: "Pedidos" },
    { id: "ajustes", icon: "settings-outline", label: "Ajustes" },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => onTabChange(item.id)}
        >
          <Ionicons
            name={item.icon as any}
            size={24}
            color={activeTab === item.id ? colors.primary : colors.muted.light}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === item.id && styles.navLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingBottom: 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
});
