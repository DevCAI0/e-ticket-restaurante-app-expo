// src/components/tickets/components/TicketFilters.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../ui/Input";
import { colors } from "../../../constants/colors";

interface TicketFiltersProps {
  onSearchChange: (text: string) => void;
  onMealTypeChange: (type: string) => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  onSearchChange,
  onMealTypeChange,
}) => {
  const [searchText, setSearchText] = useState("");
  const [mealType, setMealType] = useState("all");

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearchChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search" size={18} color={colors.muted.light} />
        </View>
        <Input
          placeholder="Buscar por número do ticket ou nome"
          value={searchText}
          onChangeText={handleSearchChange}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          <FilterButton
            label="Todas"
            active={mealType === "all"}
            onPress={() => {
              setMealType("all");
              onMealTypeChange("all");
            }}
          />
          <FilterButton
            label="Almoço"
            active={mealType === "Almoço"}
            onPress={() => {
              setMealType("Almoço");
              onMealTypeChange("Almoço");
            }}
          />
          <FilterButton
            label="Jantar"
            active={mealType === "Jantar"}
            onPress={() => {
              setMealType("Jantar");
              onMealTypeChange("Jantar");
            }}
          />
        </View>
      </View>
    </View>
  );
};

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  active,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    position: "relative",
  },
  searchIconContainer: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  filterContainer: {
    marginTop: 4,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: "#ffffff",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text.light,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
});
