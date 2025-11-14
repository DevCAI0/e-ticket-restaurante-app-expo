// src/components/tickets/components/TicketCardSkeleton.tsx
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors } from "../../../constants/colors";

export const TicketCardSkeleton: React.FC = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonTicketNumber, { opacity }]} />
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.skeletonRow, { opacity }]} />
        <Animated.View style={[styles.skeletonRow, { opacity }]} />
        <Animated.View style={[styles.skeletonRow, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonTicketNumber: {
    width: 100,
    height: 16,
    backgroundColor: colors.muted.light,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 24,
    backgroundColor: colors.muted.light,
    borderRadius: 6,
  },
  content: {
    gap: 8,
  },
  skeletonRow: {
    width: "100%",
    height: 16,
    backgroundColor: colors.muted.light,
    borderRadius: 4,
  },
});
