// src/screens/home/components/EarningsChart.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../../constants/colors";

interface ChartData {
  id: string;
  category: string;
  amount: number;
  color: string;
  radius: number;
}

export const EarningsChart: React.FC = () => {
  const [data] = useState<ChartData[]>([
    {
      id: "approved_tickets",
      category: "Últimas 24h",
      amount: 0,
      color: "#FB923C",
      radius: 42,
    },
    {
      id: "pending_tickets",
      category: "Pendentes",
      amount: 0,
      color: "#3B82F6",
      radius: 30,
    },
  ]);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const calculateStrokeDashArray = (amount: number, radius: number) => {
    if (total === 0) return { strokeDasharray: "0 264", percent: 0 };
    const circumference = 2 * Math.PI * radius;
    const percent = (amount / total) * 100;
    const dashArray = (percent * circumference) / 100;
    return {
      strokeDasharray: `${dashArray} ${circumference}`,
      percent,
    };
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View style={[styles.chartBadge, { backgroundColor: "#8B5CF6" }]} />
        <Text style={styles.chartTitle}>Resumo de Tickets</Text>
      </View>

      <View style={styles.chartContent}>
        <View style={styles.svgContainer}>
          <Svg
            height="80"
            width="80"
            viewBox="0 0 100 100"
            style={{ transform: [{ rotate: "-90deg" }] }}
          >
            <Circle
              cx="50"
              cy="50"
              r="42"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            {data.map((item) => {
              const { strokeDasharray } = calculateStrokeDashArray(
                item.amount,
                item.radius
              );
              return (
                <Circle
                  key={item.id}
                  cx="50"
                  cy="50"
                  r={item.radius}
                  stroke={item.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  fill="none"
                />
              );
            })}
          </Svg>
        </View>

        <View style={styles.legend}>
          {data.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <Text style={styles.legendLabel}>{item.category}</Text>
              </View>
              <Text style={styles.legendValue}>{item.amount}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View
                style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]}
              />
              <Text style={styles.legendLabel}>Total</Text>
            </View>
            <Text style={styles.legendValue}>{total}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    padding: 16,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  chartBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  svgContainer: {
    width: 80,
    height: 80,
  },
  legend: {
    flex: 1,
    marginLeft: 24,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.light,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.light,
  },
});
