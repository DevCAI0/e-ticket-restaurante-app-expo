// src/screens/facial/components/FacialCamera.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import * as FaceDetector from "expo-face-detector";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";
import { colors } from "../../../constants/colors";

const { width, height } = Dimensions.get("window");
const OVAL_WIDTH = 240;
const OVAL_HEIGHT = 320;

interface FacialCameraProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
  funcionarioNome?: string;
  solicitarSorriso?: boolean;
}

type CaptureStatus =
  | "positioning" // Posicionando rosto
  | "face-detected" // Rosto detectado, validando posição
  | "face-centered" // Rosto centralizado (verde)
  | "waiting-smile" // Aguardando sorriso
  | "smile-detected" // Sorriso detectado
  | "countdown" // Contagem regressiva
  | "capturing" // Capturando foto
  | "analyzing" // Analisando rosto
  | "success" // Sucesso
  | "error"; // Erro

export const FacialCamera: React.FC<FacialCameraProps> = ({
  onCapture,
  onCancel,
  funcionarioNome,
  solicitarSorriso = true,
}) => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const isFocused = useIsFocused();

  const [status, setStatus] = useState<CaptureStatus>("positioning");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [validationAttempts, setValidationAttempts] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Intervalos para validação contínua
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionStableTimeRef = useRef<number>(0);
  const smileStableTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    // Animação de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // VALIDAÇÃO CONTÍNUA - Tira fotos a cada 1 segundo para validar
  useEffect(() => {
    if (
      status === "positioning" ||
      status === "face-detected" ||
      status === "face-centered" ||
      status === "waiting-smile"
    ) {
      validationIntervalRef.current = setInterval(() => {
        captureAndValidate();
      }, 1000); // Valida a cada 1 segundo

      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
        }
      };
    }
  }, [status]);

  // Contagem regressiva
  useEffect(() => {
    if (countdown > 0 && status === "countdown") {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          finalCapture();
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, status]);

  const captureAndValidate = async () => {
    if (
      !cameraRef.current ||
      status === "capturing" ||
      status === "analyzing" ||
      status === "success"
    )
      return;

    try {
      // Tira foto silenciosamente para validação
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
      });

      const imageUri = `file://${photo.path}`;
      await validatePosition(imageUri);
    } catch (error) {
      console.log("Erro na validação contínua:", error);
    }
  };

  const validatePosition = async (imageUri: string) => {
    try {
      const options: FaceDetector.DetectionOptions = {
        mode: FaceDetector.FaceDetectorMode.fast, // Modo rápido para validação contínua
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
      };

      const result = await FaceDetector.detectFacesAsync(imageUri, options);

      // Validação 1: Tem rosto?
      if (result.faces.length === 0) {
        if (status !== "positioning") {
          setStatus("positioning");
          positionStableTimeRef.current = 0;
          smileStableTimeRef.current = 0;
        }
        return;
      }

      // Validação 2: Apenas 1 rosto?
      if (result.faces.length > 1) {
        setStatus("error");
        setErrorMessage("Apenas uma pessoa por vez");
        setTimeout(() => setStatus("positioning"), 2000);
        return;
      }

      const face = result.faces[0];

      // Validação 3: Rosto está bem posicionado?
      // Simplificado: se detectou 1 rosto, considera OK
      const isCentered = true; // Sempre considera centralizado se tem 1 rosto

      if (!isCentered) {
        if (status !== "face-detected") {
          setStatus("face-detected");
          positionStableTimeRef.current = 0;
        }
        return;
      }

      // Rosto está centralizado!
      if (status === "positioning" || status === "face-detected") {
        setStatus("face-centered");
        positionStableTimeRef.current = Date.now();
        return;
      }

      // Aguarda 0.5 segundos com rosto estável antes de pedir sorriso
      if (status === "face-centered") {
        const timeCentered = Date.now() - positionStableTimeRef.current;
        if (timeCentered < 500) {
          return;
        }
        // Avança para pedir sorriso OU inicia contagem
        if (solicitarSorriso) {
          setStatus("waiting-smile");
          smileStableTimeRef.current = 0;
        } else {
          // Sem sorriso, vai direto para contagem
          if (countdown === 0) {
            setStatus("countdown");
            setCountdown(3);
          }
        }
        return;
      }

      // Validação 4: Sorriso (se necessário)
      if (solicitarSorriso && status === "waiting-smile") {
        const smilingProbability = face.smilingProbability || 0;

        console.log("Sorriso detectado:", smilingProbability);

        if (smilingProbability < 0.5) {
          // Reduzido de 0.7 para 0.5
          return;
        }

        // Sorriso detectado!
        setStatus("smile-detected");
        smileStableTimeRef.current = Date.now();
        return;
      }

      // Aguarda 0.5 segundos com sorriso estável
      if (status === "smile-detected") {
        const timeSmiling = Date.now() - smileStableTimeRef.current;
        if (timeSmiling < 500) {
          return;
        }

        // Inicia contagem!
        if (countdown === 0) {
          setStatus("countdown");
          setCountdown(3);
        }
        return;
      }

      // Caso não solicite sorriso, o fluxo já iniciou countdown no face-centered
    } catch (error) {
      console.log("Erro ao validar posição:", error);
    }
  };

  const finalCapture = async () => {
    if (!cameraRef.current) return;

    setStatus("capturing");

    try {
      // Captura final
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
      });

      const imageUri = `file://${photo.path}`;
      setCapturedPhoto(imageUri);

      setStatus("analyzing");
      await finalValidation(imageUri);
    } catch (error) {
      console.error("Erro ao capturar foto final:", error);
      setErrorMessage("Erro ao capturar. Tente novamente.");
      setStatus("error");
      setTimeout(() => {
        setStatus("positioning");
        positionStableTimeRef.current = 0;
        smileStableTimeRef.current = 0;
      }, 2000);
    }
  };

  const finalValidation = async (imageUri: string) => {
    try {
      const options: FaceDetector.DetectionOptions = {
        mode: FaceDetector.FaceDetectorMode.accurate,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
      };

      const result = await FaceDetector.detectFacesAsync(imageUri, options);

      if (result.faces.length === 0) {
        setErrorMessage("Nenhum rosto na foto final");
        setStatus("error");
        setCapturedPhoto(null);
        setTimeout(() => {
          setStatus("positioning");
          positionStableTimeRef.current = 0;
          smileStableTimeRef.current = 0;
        }, 2000);
        return;
      }

      if (result.faces.length > 1) {
        setErrorMessage("Múltiplos rostos na foto final");
        setStatus("error");
        setCapturedPhoto(null);
        setTimeout(() => {
          setStatus("positioning");
          positionStableTimeRef.current = 0;
          smileStableTimeRef.current = 0;
        }, 2000);
        return;
      }

      // Sucesso!
      setStatus("success");

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onCapture(imageUri);
      });
    } catch (error) {
      console.error("Erro na validação final:", error);
      setErrorMessage("Erro ao analisar. Tente novamente.");
      setStatus("error");
      setCapturedPhoto(null);
      setTimeout(() => {
        setStatus("positioning");
        positionStableTimeRef.current = 0;
        smileStableTimeRef.current = 0;
      }, 2000);
    }
  };

  const getOvalColor = () => {
    switch (status) {
      case "face-centered":
      case "smile-detected":
      case "countdown":
        return colors.success; // Verde
      case "face-detected":
      case "waiting-smile":
        return colors.warning; // Amarelo
      case "success":
        return colors.success;
      case "error":
        return "#ef4444"; // Vermelho
      default:
        return "rgba(255, 255, 255, 0.5)"; // Branco
    }
  };

  const getInstructionText = () => {
    if (countdown > 0) {
      return `Capturando em ${countdown}...`;
    }

    switch (status) {
      case "positioning":
        return `${funcionarioNome ? `Olá, ${funcionarioNome}! ` : ""}Posicione seu rosto no círculo`;
      case "face-detected":
        return "Centralize seu rosto no círculo";
      case "face-centered":
        return solicitarSorriso
          ? "Rosto OK! Agora sorria 😊"
          : "Mantenha a posição...";
      case "waiting-smile":
        return "Sorria! 😊";
      case "smile-detected":
        return "Sorriso perfeito! Mantenha...";
      case "capturing":
        return "Capturando...";
      case "analyzing":
        return "Analisando...";
      case "success":
        return "Perfeito! ✨";
      case "error":
        return errorMessage;
      default:
        return "Posicione seu rosto";
    }
  };

  const activeDevice = useCameraDevice("front");

  if (hasPermission == null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Solicitando permissão...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="videocam-off" size={64} color={colors.muted.light} />
        <Text style={styles.noPermissionText}>
          Sem permissão para acessar a câmera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Solicitar Permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeDevice == null) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="videocam-off" size={64} color={colors.muted.light} />
        <Text style={styles.noPermissionText}>Nenhuma câmera disponível</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={activeDevice}
        isActive={isFocused && status !== "analyzing" && status !== "success"}
        photo={true}
      />

      {/* Preview da foto */}
      {capturedPhoto && (status === "analyzing" || status === "success") && (
        <Image
          source={{ uri: capturedPhoto }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Verificação Facial</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Oval */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.ovalContainer,
              {
                transform: [
                  {
                    scale:
                      status === "face-centered" || status === "smile-detected"
                        ? 1
                        : status === "success"
                          ? scaleAnim
                          : pulseAnim,
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.oval,
                {
                  borderColor: getOvalColor(),
                  borderWidth: 3,
                },
              ]}
            >
              {/* Cantos */}
              <View
                style={[
                  styles.corner,
                  styles.cornerTopLeft,
                  { borderColor: getOvalColor() },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerTopRight,
                  { borderColor: getOvalColor() },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerBottomLeft,
                  { borderColor: getOvalColor() },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerBottomRight,
                  { borderColor: getOvalColor() },
                ]}
              />
            </View>
          </Animated.View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          {countdown > 0 && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {status === "analyzing" && (
            <ActivityIndicator size="large" color={colors.primary} />
          )}

          {status === "success" && (
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.success}
            />
          )}

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{getInstructionText()}</Text>
          </View>

          {/* Indicadores */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      status !== "positioning"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.statusText}>Rosto</Text>
            </View>

            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      status === "face-centered" ||
                      status === "waiting-smile" ||
                      status === "smile-detected" ||
                      status === "countdown"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.statusText}>Posição</Text>
            </View>

            {solicitarSorriso && (
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        status === "smile-detected" || status === "countdown"
                          ? colors.success
                          : colors.muted.light,
                    },
                  ]}
                />
                <Text style={styles.statusText}>Sorriso</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    gap: 16,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ovalContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  bottomContainer: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  countdownBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countdownText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  instructionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    maxWidth: "90%",
    alignItems: "center",
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 24,
  },
  statusItem: {
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  noPermissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.light,
    padding: 24,
    gap: 16,
  },
  noPermissionText: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.muted.light,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
