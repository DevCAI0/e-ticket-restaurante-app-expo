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
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={[styles.card, success ? styles.cardSuccess : styles.cardError]}
      >
        {/* Ícone de Resultado */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              success
                ? styles.iconBackgroundSuccess
                : styles.iconBackgroundError,
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                success ? styles.iconCircleSuccess : styles.iconCircleError,
              ]}
            >
              <Ionicons
                name={success ? "checkmark-circle" : "close-circle"}
                size={80}
                color={success ? colors.success : colors.destructive.light}
              />
            </View>
          </View>
        </View>

        {/* Título */}
        <Text
          style={[
            styles.title,
            success ? styles.titleSuccess : styles.titleError,
          ]}
        >
          {success ? "Verificação Bem-Sucedida!" : "Verificação Falhou"}
        </Text>

        {/* Mensagem */}
        <Text style={styles.message}>{message}</Text>

        {/* Informações de Sucesso */}
        {success && funcionarioNome && (
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Verificado como:</Text>
                <Text style={styles.infoValue}>{funcionarioNome}</Text>
              </View>
            </View>

            {similaridade !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Similaridade:</Text>
                  <Text style={styles.infoValue}>
                    {(similaridade * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}

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

        {/* Imagens */}
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
                          : styles.imageBadgeError,
                      ]}
                    >
                      <Ionicons
                        name={success ? "checkmark" : "close"}
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

        {/* Botões */}
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
            style={success ? styles.buttonSuccess : styles.buttonError}
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
  titleError: {
    color: "#991B1B",
  },
  message: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: "center",
    marginBottom: 24,
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
