// src/screens/home/components/ActionCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  onPress: () => void;
  badge?: number;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  color,
  onPress,
  badge,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.actionCard}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { borderColor: color }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.light,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.destructive,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
