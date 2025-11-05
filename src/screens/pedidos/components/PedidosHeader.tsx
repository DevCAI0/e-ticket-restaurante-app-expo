import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PedidoSimplificado } from "../../../types/pedidos";
import { colors } from "../../../constants/colors";

interface PedidosHeaderProps {
  isEstabelecimento: boolean;
  isRestaurante: boolean;
  searchTerm: string;
  selectedStatus: string;
  totalCount: number;
  pedidos: PedidoSimplificado[];
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
}

export function PedidosHeader({
  isEstabelecimento,
  isRestaurante,
  searchTerm,
  selectedStatus,
  totalCount,
  pedidos,
  onCreateNew,
  onSearchChange,
  onStatusChange,
}: PedidosHeaderProps) {
  const filters = [
    { value: "all", label: "Todos", count: totalCount },
    { value: "today", label: "Hoje", count: 0 },
  ];

  if (isEstabelecimento) {
    filters.push(
      {
        value: "1",
        label: "Pendentes",
        count: pedidos.filter((p) => p.status === 1).length,
      },
      {
        value: "4",
        label: "Prontos",
        count: pedidos.filter((p) => p.status === 4).length,
      },
      {
        value: "5",
        label: "Entregues",
        count: pedidos.filter((p) => p.status === 5).length,
      }
    );
  } else if (isRestaurante) {
    filters.push(
      {
        value: "1",
        label: "Pendentes",
        count: pedidos.filter((p) => p.status === 1).length,
      },
      {
        value: "3",
        label: "Em Preparo",
        count: pedidos.filter((p) => p.status === 3).length,
      },
      {
        value: "4",
        label: "Prontos",
        count: pedidos.filter((p) => p.status === 4).length,
      },
      {
        value: "5",
        label: "Entregues",
        count: pedidos.filter((p) => p.status === 5).length,
      }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Pedidos</Text>
          <Text style={styles.subtitle}>
            {isEstabelecimento && "Estabelecimento"}
            {isRestaurante && "Restaurante"}
          </Text>
        </View>
        {isEstabelecimento && (
          <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.muted.light}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar pedido..."
          placeholderTextColor={colors.muted.light}
          value={searchTerm}
          onChangeText={onSearchChange}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterPill,
              selectedStatus === filter.value && styles.filterPillActive,
            ]}
            onPress={() => onStatusChange(filter.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                selectedStatus === filter.value && styles.filterLabelActive,
              ]}
            >
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  selectedStatus === filter.value && styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedStatus === filter.value && styles.countTextActive,
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {pedidos.length} de {totalCount} pedido{totalCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card.light,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.light,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted.light,
    marginTop: 2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: colors.text.light,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.border.light,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.light,
  },
  filterLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: colors.background.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  countBadgeActive: {
    backgroundColor: colors.primary + "30",
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.light,
  },
  countTextActive: {
    color: colors.primary,
  },
  summaryContainer: {
    paddingTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: colors.muted.light,
  },
});
