// src/screens/auth/SignInScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../constants/colors";
import type { AuthCredentials } from "../../types/user";

interface FormError {
  identifier?: string;
  senha?: string;
}

export const SignInScreen: React.FC = () => {
  const [formData, setFormData] = useState<AuthCredentials>({
    identifier: "",
    senha: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormError>({});
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();

  const validators = {
    identifier: (value: string): string => {
      if (!value.trim()) return "Login é obrigatório";
      if (value.length < 3) return "Login deve ter pelo menos 3 caracteres";
      return "";
    },
    senha: (value: string): string => {
      if (!value) return "Senha é obrigatória";
      if (value.length < 6) return "Senha deve ter pelo menos 6 caracteres";
      return "";
    },
  };

  const handleInputChange = (name: keyof AuthCredentials, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validators[name](value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormError = {
      identifier: validators.identifier(formData.identifier),
      senha: validators.senha(formData.senha),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signIn(formData);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Card de Login */}
          <View style={styles.card}>
            {/* Logo Badge dentro do card */}
            <View style={styles.logoBadge}>
              <Ionicons name="cafe" size={24} color="#ffffff" />
              <Text style={styles.badgeText}>E-ticket</Text>
            </View>

            <Text style={styles.title}>Bem-vindo ao Sistema</Text>
            <Text style={styles.subtitle}>
              Faça login para acessar sua conta
            </Text>

            {/* Input Login */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Login</Text>
              <Input
                placeholder="Paraiso01"
                value={formData.identifier}
                onChangeText={(value) => handleInputChange("identifier", value)}
                error={!!errors.identifier}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.identifier && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={colors.destructive.light}
                  />
                  <Text style={styles.errorText}>{errors.identifier}</Text>
                </View>
              )}
            </View>

            {/* Input Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordContainer}>
                <Input
                  placeholder="••••••"
                  value={formData.senha}
                  onChangeText={(value) => handleInputChange("senha", value)}
                  error={!!errors.senha}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  containerStyle={styles.passwordInput}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.muted.light}
                  />
                </TouchableOpacity>
              </View>
              {errors.senha && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={colors.destructive.light}
                  />
                  <Text style={styles.errorText}>{errors.senha}</Text>
                </View>
              )}
            </View>

            {/* Botão de Login */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footerText}>
              Sistema de gerenciamento de tickets para estabelecimentos
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEF3E2",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 32,
    gap: 8,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: colors.text.light,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.muted.light,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.light,
    marginBottom: 8,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    marginBottom: 0,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive.light,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    color: colors.muted.light,
    lineHeight: 18,
  },
});
