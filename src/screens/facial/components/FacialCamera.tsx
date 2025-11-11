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

interface FacialCameraProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
  funcionarioNome?: string;
  solicitarSorriso?: boolean;
  cameraType?: "front" | "back";
}

type CaptureStatus =
  | "waiting-face"
  | "face-ok"
  | "challenge-turn"
  | "turn-ok"
  | "show-oval"
  | "challenge-final"
  | "final-ok"
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
  const [showOval, setShowOval] = useState(false);

  const turnChallengeRef = useRef<"turn-left" | "turn-right">("turn-left");
  const finalChallengeRef = useRef<"blink" | "smile">("blink");

  const prevYawRef = useRef<number>(0);
  const prevLeftEyeRef = useRef<number>(1);
  const prevRightEyeRef = useRef<number>(1);
  const turnDetectedRef = useRef<boolean>(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ovalScaleAnim = useRef(new Animated.Value(0)).current;

  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateRandomChallenges();
  }, []);

  const generateRandomChallenges = () => {
    turnChallengeRef.current = Math.random() > 0.5 ? "turn-left" : "turn-right";
    finalChallengeRef.current = Math.random() > 0.5 ? "blink" : "smile";
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
      "challenge-turn",
      "challenge-final",
    ];

    if (activeStates.includes(status)) {
      validationIntervalRef.current = setInterval(() => {
        validateFrame();
      }, 600);

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
      "turn-ok",
      "show-oval",
      "final-ok",
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
    } catch (error) {}
  };

  const checkFaceAndLiveness = async (imageUri: string) => {
    try {
      const options: FaceDetector.DetectionOptions = {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
      };

      const result = await FaceDetector.detectFacesAsync(imageUri, options);

      if (result.faces.length === 0) {
        const isTurning = status === "challenge-turn";
        const isBlinking =
          status === "challenge-final" && finalChallengeRef.current === "blink";

        if (isTurning || isBlinking) {
          return;
        }

        if (status === "waiting-face") {
          return;
        }

        return;
      }

      if (result.faces.length > 1) {
        setStatus("error");
        setErrorMessage("Apenas uma pessoa");
        setTimeout(() => resetToStart(), 3000);
        return;
      }

      const face = result.faces[0];
      const leftEyeOpen = face.leftEyeOpenProbability || 0;
      const rightEyeOpen = face.rightEyeOpenProbability || 0;
      const smilingProbability = face.smilingProbability || 0;
      const yawAngle = face.yawAngle || 0;

      if (status === "waiting-face") {
        setStatus("face-ok");

        stepTimerRef.current = setTimeout(() => {
          setStatus("challenge-turn");
          resetChallengeState();
          startCountdown(12);
        }, 2000);
      } else if (status === "challenge-turn") {
        const completed = checkTurnChallenge(yawAngle);

        if (completed) {
          if (stepTimerRef.current) {
            clearInterval(stepTimerRef.current);
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = null;
          }

          setStatus("turn-ok");
          setTimeRemaining(0);

          stepTimerRef.current = setTimeout(() => {
            showOvalCircle();
          }, 1000);
        }
      } else if (status === "challenge-final") {
        const completed = checkFinalChallenge(
          leftEyeOpen,
          rightEyeOpen,
          smilingProbability
        );

        if (completed) {
          if (stepTimerRef.current) {
            clearInterval(stepTimerRef.current);
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = null;
          }

          setStatus("final-ok");
          setTimeRemaining(0);

          stepTimerRef.current = setTimeout(() => {
            prepareToCapture();
          }, 1000);
        }
      }
    } catch (error) {}
  };

  const checkTurnChallenge = (yawAngle: number): boolean => {
    const challenge = turnChallengeRef.current;

    if (challenge === "turn-left") {
      if (yawAngle < -15 && !turnDetectedRef.current) {
        turnDetectedRef.current = true;
        prevYawRef.current = yawAngle;
        return false;
      }

      if (turnDetectedRef.current && yawAngle > prevYawRef.current + 8) {
        return true;
      }

      if (turnDetectedRef.current && yawAngle < prevYawRef.current) {
        prevYawRef.current = yawAngle;
      }
    } else {
      if (yawAngle > 15 && !turnDetectedRef.current) {
        turnDetectedRef.current = true;
        prevYawRef.current = yawAngle;
        return false;
      }

      if (turnDetectedRef.current && yawAngle < prevYawRef.current - 8) {
        return true;
      }

      if (turnDetectedRef.current && yawAngle > prevYawRef.current) {
        prevYawRef.current = yawAngle;
      }
    }

    return false;
  };

  const checkFinalChallenge = (
    leftEyeOpen: number,
    rightEyeOpen: number,
    smilingProbability: number
  ): boolean => {
    const challenge = finalChallengeRef.current;

    if (challenge === "blink") {
      const leftChange = Math.abs(leftEyeOpen - prevLeftEyeRef.current);
      const rightChange = Math.abs(rightEyeOpen - prevRightEyeRef.current);
      const totalChange = leftChange + rightChange;

      prevLeftEyeRef.current = leftEyeOpen;
      prevRightEyeRef.current = rightEyeOpen;

      if (totalChange > 0.8) {
        return true;
      }
    } else if (challenge === "smile") {
      if (smilingProbability >= 0.5) {
        return true;
      }
    }

    return false;
  };

  const showOvalCircle = () => {
    setStatus("show-oval");
    setShowOval(true);

    Animated.spring(ovalScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    stepTimerRef.current = setTimeout(() => {
      setStatus("challenge-final");
      resetChallengeState();
      startCountdown(12);
    }, 2000);
  };

  const resetChallengeState = () => {
    turnDetectedRef.current = false;
    prevYawRef.current = 0;
    prevLeftEyeRef.current = 1;
    prevRightEyeRef.current = 1;
  };

  const startCountdown = (seconds: number) => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    setTimeRemaining(seconds);

    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setStatus("error");
          setErrorMessage("Tempo esgotado");
          setTimeout(() => resetToStart(), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    stepTimerRef.current = countdown as any;
  };

  const prepareToCapture = () => {
    setStatus("ready-to-capture");

    stepTimerRef.current = setTimeout(() => {
      capturePhoto();
    }, 1000);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    setStatus("capturing");

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const imageUri = `file://${photo.path}`;
      setCapturedPhoto(imageUri);

      setStatus("analyzing");
      await finalValidation(imageUri);
    } catch (error) {
      setStatus("error");
      setErrorMessage("Erro ao capturar");
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
        setErrorMessage("Erro na validação");
        setCapturedPhoto(null);
        setTimeout(() => resetToStart(), 3000);
        return;
      }

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
      setStatus("error");
      setErrorMessage("Erro ao validar");
      setCapturedPhoto(null);
      setTimeout(() => resetToStart(), 3000);
    }
  };

  const resetToStart = () => {
    setStatus("waiting-face");
    setTimeRemaining(0);
    setCapturedPhoto(null);
    setErrorMessage("");
    setShowOval(false);
    ovalScaleAnim.setValue(0);
    resetChallengeState();
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    generateRandomChallenges();
  };

  const getInstructionText = () => {
    switch (status) {
      case "waiting-face":
        return "Mostre seu rosto";
      case "face-ok":
        return "Preparando...";
      case "challenge-turn":
        return turnChallengeRef.current === "turn-left"
          ? "Vire para ESQUERDA"
          : "Vire para DIREITA";
      case "turn-ok":
        return "Completo!";
      case "show-oval":
        return "Posicione no círculo";
      case "challenge-final":
        return finalChallengeRef.current === "blink" ? "Pisque" : "Sorria";
      case "final-ok":
        return "Perfeito!";
      case "ready-to-capture":
        return "Capturando...";
      case "capturing":
        return "Processando...";
      case "analyzing":
        return "Analisando...";
      case "success":
        return "Concluído!";
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

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Verificação Facial</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.centerContainer}>
          {showOval && (
            <Animated.View
              style={[
                styles.ovalContainer,
                {
                  transform: [{ scale: ovalScaleAnim }],
                },
              ]}
            >
              <View style={styles.oval} />
            </Animated.View>
          )}
        </View>

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
            (status === "challenge-turn" || status === "challenge-final") && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{timeRemaining}</Text>
              </View>
            )}

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{getInstructionText()}</Text>
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
    width: width * 0.7,
    height: height * 0.5,
    borderRadius: (width * 0.7) / 2,
    borderWidth: 4,
    borderColor: "#4A90E2",
    backgroundColor: "transparent",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: "85%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
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
  buttonSecondary: { backgroundColor: colors.muted.light },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
