// src/screens/tickets/ManualVerificationScreen_NEW.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../constants/colors";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TicketDetails } from "../../components/tickets/components/TicketDetails";
import { ticketService, Ticket } from "../../api/tickets/ticketService";
import { useAuth } from "../../hooks/useAuth";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

interface VerificationResult {
  status: "success" | "error";
  message: string;
  ticket?: Ticket;
}

export const ManualVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [numeroTicket, setNumeroTicket] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const formatToken = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  };

  const handleTokenChange = (value: string) => {
    const formatted = formatToken(value);
    setToken(formatted);
  };

  const handleNumeroChange = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    setNumeroTicket(numbers);
  };

  const isFormValid = () => {
    const tokenLength = token.replace(/\D/g, "").length === 6;
    const ticketLength = numeroTicket.length > 0;
    return tokenLength && ticketLength;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    if (!user?.id_restaurante) {
      showErrorToast("Restaurante não identificado");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const cleanToken = token.replace(/\D/g, "");
      const response = await ticketService.verificarTicketManual(
        numeroTicket.trim(),
        cleanToken,
        user.id_restaurante
      );

      if (response.success === false) {
        setResult({
          status: "error",
          message: response.message,
        });
        showErrorToast(response.message);
      } else {
        setResult({
          status: "success",
          message: response.message,
          ticket: response.ticket,
        });
        showSuccessToast("Ticket encontrado com sucesso!");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao verificar o ticket";

      setResult({
        status: "error",
        message: errorMessage,
      });
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketApproved = () => {
    showSuccessToast("Ticket aprovado com sucesso!");

    setTimeout(() => {
      setResult(null);
      setNumeroTicket("");
      setToken("");
    }, 1500);
  };

  const handleApproveTicket = async (ticketId: number, tokenValue: string) => {
    if (!user?.id_restaurante) {
      throw new Error("Restaurante não identificado");
    }

    const response = await ticketService.aprovarTicket(
      ticketId,
      tokenValue,
      user.id_restaurante
    );

    if (!response.success) {
      throw new Error(response.message);
    }
  };

  const handleReset = () => {
    setResult(null);
    setNumeroTicket("");
    setToken("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificação Manual</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número do Ticket</Text>
            <Input
              value={numeroTicket}
              onChangeText={handleNumeroChange}
              placeholder="Digite o número do ticket"
              keyboardType="number-pad"
              editable={!loading}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token de Validação</Text>
            <Input
              value={token}
              onChangeText={handleTokenChange}
              placeholder="123-456"
              keyboardType="number-pad"
              maxLength={7}
              style={styles.tokenInput}
              editable={!loading}
            />
            <Text style={styles.inputHint}>
              Digite o token de 6 dígitos fornecido com o ticket
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              onPress={handleReset}
              variant="outline"
              disabled={loading}
              style={styles.halfButton}
            >
              Voltar
            </Button>

            <Button
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
              style={styles.halfButton}
            >
              {loading ? (
                <View style={styles.buttonLoading}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.buttonTextWhite}>Verificando...</Text>
                </View>
              ) : (
                "Verificar Ticket"
              )}
            </Button>
          </View>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultSection}>
            {result.status === "success" && result.ticket ? (
              <View>
                {/* Success Alert */}
                <View style={styles.validAlert}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <View>
                    <Text style={styles.validTitle}>Ticket Válido!</Text>
                    <Text style={styles.validSubtitle}>Ticket válido</Text>
                  </View>
                </View>

                {/* Ticket Details */}
                <TicketDetails
                  ticket={result.ticket}
                  onApproved={handleTicketApproved}
                  onApprove={handleApproveTicket}
                />
              </View>
            ) : (
              <View style={styles.errorAlert}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colors.destructive.light}
                />
                <Text style={styles.errorTitle}>Erro!</Text>
                <Text style={styles.errorMessage}>{result.message}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.light,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  input: {
    fontSize: 16,
  },
  tokenInput: {
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 4,
  },
  inputHint: {
    fontSize: 12,
    color: colors.muted.light,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  halfButton: {
    flex: 1,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonTextWhite: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  resultSection: {
    marginTop: 8,
  },
  validAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22C55E",
    marginBottom: 16,
  },
  validTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  validSubtitle: {
    fontSize: 12,
    color: "#059669",
  },
  errorAlert: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.destructive.light + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.destructive.light,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.destructive.light,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: "center",
  },
});
