// src/screens/facial/components/FacialCamera.tsx
// SEM CÍRCULO - DETECÇÃO LIVRE COM DESAFIOS DE VIVACIDADE

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

interface FacialCameraProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
  funcionarioNome?: string;
  solicitarSorriso?: boolean;
  cameraType?: "front" | "back";
}

type LivenessChallenge = "blink" | "turn-left" | "turn-right" | "smile";

type CaptureStatus =
  | "waiting-face"
  | "face-ok"
  | "challenge-1"
  | "challenge-1-ok"
  | "challenge-2"
  | "challenge-2-ok"
  | "challenge-3"
  | "challenge-3-ok"
  | "ready-to-capture"
  | "capturing"
  | "analyzing"
  | "success"
  | "error";

export const FacialCamera: React.FC<FacialCameraProps> = ({
  onCapture,
  onCancel,
  funcionarioNome,
  solicitarSorriso = true,
  cameraType = "front",
}) => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();

  const [status, setStatus] = useState<CaptureStatus>("waiting-face");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // ✅ 3 DESAFIOS: VIRAR, PISCAR, SORRIR
  const challenge1Ref = useRef<LivenessChallenge | null>(null);
  const challenge2Ref = useRef<LivenessChallenge | null>(null);
  const challenge3Ref = useRef<LivenessChallenge | null>(null);

  // Estados para detecção
  const prevYawRef = useRef<number>(0);
  const prevLeftEyeRef = useRef<number>(1);
  const prevRightEyeRef = useRef<number>(1);
  const turnDetectedRef = useRef<boolean>(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateRandomChallenges();
  }, []);

  const generateRandomChallenges = () => {
    // ✅ EMBARALHA OS 3 DESAFIOS
    const availableChallenges: LivenessChallenge[] = [
      "blink",
      "turn-left",
      "turn-right",
      "smile",
    ];

    const shuffled = availableChallenges.sort(() => Math.random() - 0.5);
    challenge1Ref.current = shuffled[0];
    challenge2Ref.current = shuffled[1];
    challenge3Ref.current = shuffled[2];

    console.log(
      `🎲 Desafios: 1=${challenge1Ref.current} 2=${challenge2Ref.current} 3=${challenge3Ref.current}`
    );
  };

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    const activeStates: CaptureStatus[] = [
      "waiting-face",
      "face-ok",
      "challenge-1",
      "challenge-2",
      "challenge-3",
    ];

    if (activeStates.includes(status)) {
      validationIntervalRef.current = setInterval(() => {
        validateFrame();
      }, 600); // Mais rápido para virar

      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
        }
      };
    } else {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
    }
  }, [status]);

  useEffect(() => {
    return () => {
      if (validationIntervalRef.current)
        clearInterval(validationIntervalRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  const validateFrame = async () => {
    if (!cameraRef.current) return;

    const skipStates: CaptureStatus[] = [
      "error",
      "challenge-1-ok",
      "challenge-2-ok",
      "challenge-3-ok",
      "ready-to-capture",
      "capturing",
      "analyzing",
      "success",
    ];
    if (skipStates.includes(status)) return;

    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const imageUri = `file://${photo.path}`;
      await checkFaceAndLiveness(imageUri);
    } catch (error) {
      console.log("Erro na validação:", error);
    }
  };

  const checkFaceAndLiveness = async (imageUri: string) => {
    try {
      const options: FaceDetector.DetectionOptions = {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
      };

      const result = await FaceDetector.detectFacesAsync(imageUri, options);

      // SEM ROSTO - Mais tolerante, não reseta imediatamente
      if (result.faces.length === 0) {
        // Ignora perda temporária durante piscar ou virar
        const isBlinking =
          (status === "challenge-1" && challenge1Ref.current === "blink") ||
          (status === "challenge-2" && challenge2Ref.current === "blink") ||
          (status === "challenge-3" && challenge3Ref.current === "blink");

        const isTurning =
          (status === "challenge-1" &&
            (challenge1Ref.current === "turn-left" ||
              challenge1Ref.current === "turn-right")) ||
          (status === "challenge-2" &&
            (challenge2Ref.current === "turn-left" ||
              challenge2Ref.current === "turn-right")) ||
          (status === "challenge-3" &&
            (challenge3Ref.current === "turn-left" ||
              challenge3Ref.current === "turn-right"));

        if (isBlinking || isTurning) {
          console.log("⏸️ Perda temporária de rosto - ignorando");
          return;
        }

        // Só dá erro se estiver esperando rosto inicial
        if (status === "waiting-face") {
          return; // Aguarda rosto aparecer
        }

        return; // Mais tolerante em geral
      }

      // MÚLTIPLOS ROSTOS
      if (result.faces.length > 1) {
        setStatus("error");
        setErrorMessage("Apenas uma pessoa por vez");
        setTimeout(() => resetToStart(), 3000);
        return;
      }

      const face = result.faces[0];
      const leftEyeOpen = face.leftEyeOpenProbability || 0;
      const rightEyeOpen = face.rightEyeOpenProbability || 0;
      const smilingProbability = face.smilingProbability || 0;
      const yawAngle = face.yawAngle || 0;

      console.log(
        `👁️ E${Math.round(leftEyeOpen * 100)}% D${Math.round(rightEyeOpen * 100)}% | 😊 ${Math.round(smilingProbability * 100)}% | 🔄 ${Math.round(yawAngle)}°`
      );

      // MÁQUINA DE ESTADOS
      if (status === "waiting-face") {
        console.log("✅ STEP 1: Rosto detectado!");
        setStatus("face-ok");

        stepTimerRef.current = setTimeout(() => {
          console.log(`➡️ STEP 2: Desafio 1 = ${challenge1Ref.current}`);
          setStatus("challenge-1");
          resetChallengeState();
          startCountdown(12);
        }, 2000);
      } else if (status === "challenge-1") {
        const completed = checkChallengeCompletion(
          challenge1Ref.current!,
          leftEyeOpen,
          rightEyeOpen,
          smilingProbability,
          yawAngle
        );

        if (completed) {
          console.log(`✅ Desafio 1 (${challenge1Ref.current}) COMPLETO!`);

          // ✅ LIMPA O COUNTDOWN IMEDIATAMENTE!
          if (stepTimerRef.current) {
            clearInterval(stepTimerRef.current);
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = null;
          }

          setStatus("challenge-1-ok");
          setTimeRemaining(0);

          stepTimerRef.current = setTimeout(() => {
            console.log(`➡️ STEP 3: Desafio 2 = ${challenge2Ref.current}`);
            setStatus("challenge-2");
            resetChallengeState();
            startCountdown(12);
          }, 1000);
        }
      } else if (status === "challenge-2") {
        const completed = checkChallengeCompletion(
          challenge2Ref.current!,
          leftEyeOpen,
          rightEyeOpen,
          smilingProbability,
          yawAngle
        );

        if (completed) {
          console.log(`✅ Desafio 2 (${challenge2Ref.current}) COMPLETO!`);

          // ✅ LIMPA O COUNTDOWN IMEDIATAMENTE!
          if (stepTimerRef.current) {
            clearInterval(stepTimerRef.current);
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = null;
          }

          setStatus("challenge-2-ok");
          setTimeRemaining(0);

          stepTimerRef.current = setTimeout(() => {
            console.log(`➡️ STEP 4: Desafio 3 = ${challenge3Ref.current}`);
            setStatus("challenge-3");
            resetChallengeState();
            startCountdown(12);
          }, 1000);
        }
      } else if (status === "challenge-3") {
        const completed = checkChallengeCompletion(
          challenge3Ref.current!,
          leftEyeOpen,
          rightEyeOpen,
          smilingProbability,
          yawAngle
        );

        if (completed) {
          console.log(`✅ Desafio 3 (${challenge3Ref.current}) COMPLETO!`);

          // ✅ LIMPA O COUNTDOWN IMEDIATAMENTE!
          if (stepTimerRef.current) {
            clearInterval(stepTimerRef.current);
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = null;
          }

          setStatus("challenge-3-ok");
          setTimeRemaining(0);

          stepTimerRef.current = setTimeout(() => {
            prepareToCapture();
          }, 1000);
        }
      }
    } catch (error) {
      console.log("Erro ao analisar:", error);
    }
  };

  const checkChallengeCompletion = (
    challenge: LivenessChallenge,
    leftEyeOpen: number,
    rightEyeOpen: number,
    smilingProbability: number,
    yawAngle: number
  ): boolean => {
    switch (challenge) {
      case "blink":
        const leftChange = Math.abs(leftEyeOpen - prevLeftEyeRef.current);
        const rightChange = Math.abs(rightEyeOpen - prevRightEyeRef.current);
        const totalChange = leftChange + rightChange;

        prevLeftEyeRef.current = leftEyeOpen;
        prevRightEyeRef.current = rightEyeOpen;

        if (totalChange > 0.8) {
          console.log(
            `👁️ PISCADA! Variação: ${Math.round(totalChange * 100)}%`
          );
          return true;
        }
        break;

      case "turn-left":
        // Detecta virada para esquerda
        if (yawAngle < -15 && !turnDetectedRef.current) {
          console.log(`👈 Virou ESQUERDA! (${yawAngle.toFixed(1)}°)`);
          turnDetectedRef.current = true;
          prevYawRef.current = yawAngle;
          return false;
        }

        // Detecta retorno
        if (turnDetectedRef.current && yawAngle > prevYawRef.current + 8) {
          console.log(
            `✅ VOLTOU! (${prevYawRef.current.toFixed(1)}° → ${yawAngle.toFixed(1)}°)`
          );
          return true;
        }

        if (turnDetectedRef.current && yawAngle < prevYawRef.current) {
          prevYawRef.current = yawAngle;
        }
        break;

      case "turn-right":
        // Detecta virada para direita
        if (yawAngle > 15 && !turnDetectedRef.current) {
          console.log(`👉 Virou DIREITA! (${yawAngle.toFixed(1)}°)`);
          turnDetectedRef.current = true;
          prevYawRef.current = yawAngle;
          return false;
        }

        // Detecta retorno
        if (turnDetectedRef.current && yawAngle < prevYawRef.current - 8) {
          console.log(
            `✅ VOLTOU! (${prevYawRef.current.toFixed(1)}° → ${yawAngle.toFixed(1)}°)`
          );
          return true;
        }

        if (turnDetectedRef.current && yawAngle > prevYawRef.current) {
          prevYawRef.current = yawAngle;
        }
        break;

      case "smile":
        if (smilingProbability >= 0.5) {
          console.log(`😊 Sorriso! (${Math.round(smilingProbability * 100)}%)`);
          return true;
        }
        break;
    }

    return false;
  };

  const resetChallengeState = () => {
    turnDetectedRef.current = false;
    prevYawRef.current = 0;
    prevLeftEyeRef.current = 1;
    prevRightEyeRef.current = 1;
  };

  const startCountdown = (seconds: number) => {
    // ✅ LIMPA countdown anterior antes de criar novo
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    setTimeRemaining(seconds);

    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          console.log(`⏰ Timeout do desafio`);
          setStatus("error");
          setErrorMessage(`Você não completou o desafio. Tente novamente.`);
          setTimeout(() => resetToStart(), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ✅ SALVA referência do countdown para poder limpar
    stepTimerRef.current = countdown as any;
  };

  const prepareToCapture = () => {
    console.log("🎯 STEP 5: Preparando captura...");
    setStatus("ready-to-capture");

    stepTimerRef.current = setTimeout(() => {
      capturePhoto();
    }, 1000);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    console.log("📸 STEP 6: Capturando...");
    setStatus("capturing");

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const imageUri = `file://${photo.path}`;
      setCapturedPhoto(imageUri);

      setStatus("analyzing");
      await finalValidation(imageUri);
    } catch (error) {
      console.error("Erro ao capturar:", error);
      setStatus("error");
      setErrorMessage("Erro ao capturar foto.");
      setTimeout(() => resetToStart(), 3000);
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

      if (result.faces.length !== 1) {
        setStatus("error");
        setErrorMessage("Erro na foto final");
        setCapturedPhoto(null);
        setTimeout(() => resetToStart(), 3000);
        return;
      }

      console.log("✅ STEP 7: SUCESSO!");
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
      console.error("Erro validação final:", error);
      setStatus("error");
      setErrorMessage("Erro ao validar foto");
      setCapturedPhoto(null);
      setTimeout(() => resetToStart(), 3000);
    }
  };

  const resetToStart = () => {
    console.log("🔄 Resetando...");
    setStatus("waiting-face");
    setTimeRemaining(0);
    setCapturedPhoto(null);
    setErrorMessage("");
    resetChallengeState();
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    generateRandomChallenges();
  };

  const getChallengeDisplayName = (
    challenge: LivenessChallenge | null
  ): string => {
    switch (challenge) {
      case "blink":
        return "👁️ PISQUE os olhos";
      case "turn-left":
        return "👈 Vire o rosto para ESQUERDA";
      case "turn-right":
        return "👉 Vire o rosto para DIREITA";
      case "smile":
        return "😊 SORRIA";
      default:
        return "Aguarde...";
    }
  };

  const getInstructionText = () => {
    switch (status) {
      case "waiting-face":
        return `${funcionarioNome ? `Olá, ${funcionarioNome}!\n` : ""}Mostre seu rosto para a câmera`;
      case "face-ok":
        return "Rosto detectado! Preparando desafios...";
      case "challenge-1":
        return `${getChallengeDisplayName(challenge1Ref.current)}\n(${timeRemaining}s)`;
      case "challenge-1-ok":
        return "Desafio 1 completo! ✅";
      case "challenge-2":
        return `${getChallengeDisplayName(challenge2Ref.current)}\n(${timeRemaining}s)`;
      case "challenge-2-ok":
        return "Desafio 2 completo! ✅";
      case "challenge-3":
        return `${getChallengeDisplayName(challenge3Ref.current)}\n(${timeRemaining}s)`;
      case "challenge-3-ok":
        return "Todos os desafios completos! ✅";
      case "ready-to-capture":
        return "Pronto! Capturando...";
      case "capturing":
        return "Capturando foto...";
      case "analyzing":
        return "Analisando...";
      case "success":
        return "Verificação concluída! ✨";
      case "error":
        return errorMessage;
      default:
        return "Aguarde...";
    }
  };

  const activeDevice = useCameraDevice(cameraType);

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
        <Text style={styles.noPermissionText}>Sem permissão para câmera</Text>
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

      {capturedPhoto && (status === "analyzing" || status === "success") && (
        <Image
          source={{ uri: capturedPhoto }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* ✅ SEM CÍRCULO - Apenas overlay com instruções */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Verificação Facial</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Espaço vazio no meio - sem círculo */}
        <View style={styles.centerContainer} />

        <View style={styles.bottomContainer}>
          {status === "analyzing" && (
            <ActivityIndicator size="large" color="#ffffff" />
          )}
          {status === "success" && (
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.success}
            />
          )}

          {timeRemaining > 0 &&
            (status === "challenge-1" ||
              status === "challenge-2" ||
              status === "challenge-3") && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{timeRemaining}</Text>
              </View>
            )}

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{getInstructionText()}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      status !== "waiting-face"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.progressText}>Rosto</Text>
            </View>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      status === "challenge-1-ok" ||
                      status === "challenge-2" ||
                      status === "challenge-2-ok" ||
                      status === "challenge-3" ||
                      status === "challenge-3-ok" ||
                      status === "ready-to-capture" ||
                      status === "capturing" ||
                      status === "analyzing" ||
                      status === "success"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.progressText}>1</Text>
            </View>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      status === "challenge-2-ok" ||
                      status === "challenge-3" ||
                      status === "challenge-3-ok" ||
                      status === "ready-to-capture" ||
                      status === "capturing" ||
                      status === "analyzing" ||
                      status === "success"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.progressText}>2</Text>
            </View>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      status === "challenge-3-ok" ||
                      status === "ready-to-capture" ||
                      status === "capturing" ||
                      status === "analyzing" ||
                      status === "success"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.progressText}>3</Text>
            </View>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      status === "capturing" ||
                      status === "analyzing" ||
                      status === "success"
                        ? colors.success
                        : colors.muted.light,
                  },
                ]}
              />
              <Text style={styles.progressText}>Foto</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    gap: 16,
  },
  loadingText: { color: "#ffffff", fontSize: 16 },
  overlay: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  centerContainer: { flex: 1 },
  bottomContainer: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingTop: 24,
  },
  timerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerText: { fontSize: 36, fontWeight: "bold", color: "#ffffff" },
  instructionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    maxWidth: "90%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 26,
  },
  progressContainer: { flexDirection: "row", gap: 16 },
  progressStep: { alignItems: "center", gap: 6 },
  progressDot: { width: 12, height: 12, borderRadius: 6 },
  progressText: { color: "#ffffff", fontSize: 11, fontWeight: "500" },
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
  buttonSecondary: { backgroundColor: colors.muted.light },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
