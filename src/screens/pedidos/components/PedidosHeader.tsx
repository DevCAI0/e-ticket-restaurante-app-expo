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
    { value: "all", label: "Todos" },
    { value: "today", label: "Hoje" },
  ];

  if (isEstabelecimento) {
    filters.push(
      { value: "1", label: "Pendentes" },
      { value: "4", label: "Prontos" },
      { value: "5", label: "Entregues" }
    );
  } else if (isRestaurante) {
    filters.push(
      { value: "1", label: "Pendentes" },
      { value: "3", label: "Em Preparo" },
      { value: "4", label: "Prontos" },
      { value: "5", label: "Entregues" }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="receipt" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Pedidos1</Text>
            <Text style={styles.subtitle}>
              {isEstabelecimento && "Estabelecimento"}
              {isRestaurante && "Restaurante"}
            </Text>
          </View>
        </View>

        {isEstabelecimento && (
          <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.muted.light} />
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
              styles.filterTab,
              selectedStatus === filter.value && styles.filterTabActive,
            ]}
            onPress={() => onStatusChange(filter.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === filter.value && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
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
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.light,
    height: 40,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.border.light,
  },
  filterTabActive: {
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.light,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  summaryContainer: {
    paddingTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: colors.muted.light,
  },
});
