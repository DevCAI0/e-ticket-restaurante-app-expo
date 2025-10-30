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
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  color,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.actionCard}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle, { borderColor: color }]}>
          <Ionicons name={icon} size={28} color={color} />
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.light,
    textAlign: "center",
  },
});
