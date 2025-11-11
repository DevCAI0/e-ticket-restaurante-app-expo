// src/screens/facial/components/FacialResult.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

const { width } = Dimensions.get("window");

interface FacialResultProps {
  success: boolean;
  message: string;
  capturedImage?: string;
  referenceImage?: string;
  funcionarioNome?: string;
  similaridade?: number;
  tempoProcessamento?: number;
  onClose: () => void;
  onRetry?: () => void;
}

export const FacialResult: React.FC<FacialResultProps> = ({
  success,
  message,
  capturedImage,
  referenceImage,
  funcionarioNome,
  similaridade,
  tempoProcessamento,
  onClose,
  onRetry,
}) => {
  const renderMessage = () => {
    // Detectar mensagens de horário - MUITO CEDO
    if (
      message.includes("Muito cedo") ||
      message.includes("Horário disponível")
    ) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.messageIconContainer}>
            <Ionicons name="time-outline" size={32} color={colors.warning} />
          </View>
          <Text style={styles.messageWarning}>{message}</Text>
          <View style={styles.messageHint}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.messageHintText}>
              Aguarde até o horário de início para consumir esta liberação
            </Text>
          </View>
        </View>
      );
    }

    // Detectar mensagens de horário - EXPIRADO
    if (message.includes("expirada") || message.includes("Horário era até")) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.messageIconContainer}>
            <Ionicons
              name="time-outline"
              size={32}
              color={colors.destructive.light}
            />
          </View>
          <Text style={styles.messageError}>{message}</Text>
          <View style={[styles.messageHint, styles.messageHintError]}>
            <Ionicons
              name="alert-circle"
              size={16}
              color={colors.destructive.light}
            />
            <Text style={styles.messageHintTextError}>
              O horário para consumir esta liberação já passou
            </Text>
          </View>
        </View>
      );
    }

    // Detectar mensagens de horário - INDISPONÍVEL
    if (message.includes("indisponível neste momento")) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.messageIconContainer}>
            <Ionicons name="ban" size={32} color={colors.muted.light} />
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.messageHint}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.messageHintText}>
              Verifique os horários disponíveis para cada tipo de refeição
            </Text>
          </View>
        </View>
      );
    }

    // Mensagem de sem liberações
    if (message.includes("mas não possui liberações disponíveis")) {
      const parts = message.split("mas não possui liberações disponíveis");
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {parts[0]}
            <Text style={styles.messageWarning}>
              mas não possui liberações disponíveis
            </Text>
            {parts[1]}
          </Text>
        </View>
      );
    }

    return <Text style={styles.message}>{message}</Text>;
  };

  // Detectar se é erro de horário para ajustar estilo do card
  const isTimeError =
    message.includes("Muito cedo") ||
    message.includes("expirada") ||
    message.includes("indisponível neste momento");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={[
          styles.card,
          success
            ? styles.cardSuccess
            : isTimeError
              ? styles.cardWarning
              : styles.cardError,
        ]}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              success
                ? styles.iconBackgroundSuccess
                : isTimeError
                  ? styles.iconBackgroundWarning
                  : styles.iconBackgroundError,
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                success
                  ? styles.iconCircleSuccess
                  : isTimeError
                    ? styles.iconCircleWarning
                    : styles.iconCircleError,
              ]}
            >
              <Ionicons
                name={
                  success
                    ? "checkmark-circle"
                    : isTimeError
                      ? "time"
                      : "close-circle"
                }
                size={80}
                color={
                  success
                    ? colors.success
                    : isTimeError
                      ? colors.warning
                      : colors.destructive.light
                }
              />
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.title,
            success
              ? styles.titleSuccess
              : isTimeError
                ? styles.titleWarning
                : styles.titleError,
          ]}
        >
          {success
            ? "Verificação Bem-Sucedida!"
            : isTimeError
              ? "Fora do Horário"
              : "Verificação Falhou"}
        </Text>

        {renderMessage()}

        {success && funcionarioNome && (
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Verificado como:</Text>
                <Text style={styles.infoValue}>{funcionarioNome}</Text>
              </View>
            </View>

            {tempoProcessamento !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Tempo:</Text>
                  <Text style={styles.infoValue}>
                    {(tempoProcessamento / 1000).toFixed(1)}s
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {(capturedImage || referenceImage) && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesTitle}>Imagens Utilizadas</Text>

            <View style={styles.imagesRow}>
              {capturedImage && (
                <View style={styles.imageBox}>
                  <Text style={styles.imageLabel}>Foto Capturada</Text>
                  <View
                    style={[
                      styles.imageWrapper,
                      success
                        ? styles.imageWrapperSuccess
                        : isTimeError
                          ? styles.imageWrapperWarning
                          : styles.imageWrapperError,
                    ]}
                  >
                    <Image
                      source={{ uri: capturedImage }}
                      style={styles.image}
                    />
                    <View
                      style={[
                        styles.imageBadge,
                        success
                          ? styles.imageBadgeSuccess
                          : isTimeError
                            ? styles.imageBadgeWarning
                            : styles.imageBadgeError,
                      ]}
                    >
                      <Ionicons
                        name={
                          success ? "checkmark" : isTimeError ? "time" : "close"
                        }
                        size={16}
                        color="#ffffff"
                      />
                    </View>
                  </View>
                </View>
              )}

              {referenceImage && success && (
                <View style={styles.imageBox}>
                  <Text style={styles.imageLabel}>Foto Referência</Text>
                  <View style={styles.imageWrapperReference}>
                    <Image
                      source={{ uri: referenceImage }}
                      style={styles.image}
                    />
                    <View style={styles.imageBadgeReference}>
                      <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color="#ffffff"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {!success && onRetry && (
            <Button onPress={onRetry} variant="outline" style={styles.button}>
              <View style={styles.buttonContent}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </View>
            </Button>
          )}

          <Button
            onPress={onClose}
            style={
              success
                ? styles.buttonSuccess
                : isTimeError
                  ? styles.buttonWarning
                  : styles.buttonError
            }
          >
            <Text style={styles.closeButtonText}>
              {success ? "Continuar" : "Fechar"}
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  contentContainer: {
    padding: 16,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 500,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSuccess: {
    backgroundColor: "#F0FDF4",
  },
  cardWarning: {
    backgroundColor: "#FFFBEB",
  },
  cardError: {
    backgroundColor: "#FEF2F2",
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackgroundSuccess: {
    backgroundColor: "#DCFCE7",
  },
  iconBackgroundWarning: {
    backgroundColor: "#FEF3C7",
  },
  iconBackgroundError: {
    backgroundColor: "#FEE2E2",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSuccess: {
    backgroundColor: "#BBF7D0",
  },
  iconCircleWarning: {
    backgroundColor: "#FDE68A",
  },
  iconCircleError: {
    backgroundColor: "#FECACA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  titleSuccess: {
    color: "#166534",
  },
  titleWarning: {
    color: "#92400E",
  },
  titleError: {
    color: "#991B1B",
  },
  message: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  messageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  messageIconContainer: {
    marginBottom: 8,
  },
  messageWarning: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.warning,
    textAlign: "center",
    lineHeight: 24,
  },
  messageError: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.destructive.light,
    textAlign: "center",
    lineHeight: 24,
  },
  messageHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  messageHintError: {
    backgroundColor: colors.destructive.light + "10",
    borderColor: colors.destructive.light + "30",
  },
  messageHintText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  messageHintTextError: {
    color: colors.destructive.light,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted.light,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.light,
  },
  imagesContainer: {
    width: "100%",
    marginBottom: 24,
  },
  imagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 16,
    textAlign: "center",
  },
  imagesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  imageBox: {
    alignItems: "center",
    gap: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: colors.muted.light,
    fontWeight: "500",
  },
  imageWrapper: {
    position: "relative",
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
  },
  imageWrapperSuccess: {
    borderColor: colors.success,
    backgroundColor: "#DCFCE7",
  },
  imageWrapperWarning: {
    borderColor: colors.warning,
    backgroundColor: "#FEF3C7",
  },
  imageWrapperError: {
    borderColor: colors.destructive.light,
    backgroundColor: "#FEE2E2",
  },
  imageWrapperReference: {
    position: "relative",
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBadgeSuccess: {
    backgroundColor: colors.success,
  },
  imageBadgeWarning: {
    backgroundColor: colors.warning,
  },
  imageBadgeError: {
    backgroundColor: colors.destructive.light,
  },
  imageBadgeReference: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
  },
  buttonError: {
    backgroundColor: colors.destructive.light,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
