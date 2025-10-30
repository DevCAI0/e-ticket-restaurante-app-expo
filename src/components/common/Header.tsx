// src/components/common/Header.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoIcon}>
          <Ionicons name="ticket" size={20} color="#ffffff" />
        </View>
        <Text style={styles.headerTitle}>Ticket</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="sunny-outline" size={22} color={colors.text.light} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.text.light}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
});
