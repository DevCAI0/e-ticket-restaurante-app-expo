// src/screens/facial/components/FacialCamera.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FaceDetector from "expo-face-detector";
import { Ionicons } from "@expo/vector-icons";
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

export const FacialCamera: React.FC<FacialCameraProps> = ({
  onCapture,
  onCancel,
  funcionarioNome,
  solicitarSorriso = false,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>("front");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInOval, setFaceInOval] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    // Animação de pulso para o oval
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

    // Animação de bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (faceInOval && (!solicitarSorriso || smileDetected) && !isCapturing) {
      if (countdown === 0) {
        setCountdown(3);
      }
    } else {
      setCountdown(0);
    }
  }, [faceInOval, smileDetected, solicitarSorriso, isCapturing]);

  useEffect(() => {
    if (countdown > 0 && !isCapturing) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          handleCapture();
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isCapturing]);

  const handleFacesDetected = ({ faces }: FaceDetector.DetectionResult) => {
    if (isCapturing) return;

    if (faces.length === 0) {
      setFaceDetected(false);
      setFaceInOval(false);
      setSmileDetected(false);
      return;
    }

    if (faces.length > 1) {
      setFaceDetected(false);
      setFaceInOval(false);
      return;
    }

    const face = faces[0];
    setFaceDetected(true);

    // Verificar se o rosto está dentro do oval
    const centerX = width / 2;
    const centerY = height / 2;
    const faceX = face.bounds.origin.x + face.bounds.size.width / 2;
    const faceY = face.bounds.origin.y + face.bounds.size.height / 2;

    const distanceX = Math.abs(faceX - centerX);
    const distanceY = Math.abs(faceY - centerY);

    const isInOval =
      distanceX < OVAL_WIDTH / 2.5 && distanceY < OVAL_HEIGHT / 2.5;
    setFaceInOval(isInOval);

    // Detectar sorriso se solicitado
    if (solicitarSorriso && isInOval) {
      const smilingProbability = face.smilingProbability || 0;
      setSmileDetected(smilingProbability > 0.7);
    } else if (!solicitarSorriso) {
      setSmileDetected(true);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo.uri) {
        onCapture(photo.uri);
      }
    } catch (error) {
      console.error("Erro ao capturar foto:", error);
      setIsCapturing(false);
      setCountdown(0);
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
    setFaceDetected(false);
    setFaceInOval(false);
    setSmileDetected(false);
    setCountdown(0);
  };

  const getOvalColor = () => {
    if (faceInOval && (!solicitarSorriso || smileDetected)) {
      return colors.success;
    }
    if (faceDetected) {
      return colors.warning;
    }
    return "rgba(255, 255, 255, 0.5)";
  };

  const getInstructionText = () => {
    if (!faceDetected) {
      return "Posicione seu rosto no oval";
    }
    if (!faceInOval) {
      return "Centralize seu rosto";
    }
    if (solicitarSorriso && !smileDetected) {
      return `Sorria${funcionarioNome ? ", " + funcionarioNome : ""}! 😊`;
    }
    if (countdown > 0) {
      return `Capturando em ${countdown}...`;
    }
    return "Mantenha a posição";
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="videocam-off" size={64} color={colors.muted.light} />
        <Text style={styles.noPermissionText}>
          Sem permissão para acessar a câmera
        </Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        {/* Overlay escuro */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.title}>Verificação Facial</Text>

            <TouchableOpacity
              onPress={toggleCameraType}
              style={styles.flipButton}
            >
              <Ionicons name="camera-reverse" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Oval de detecção */}
          <View style={styles.centerContainer}>
            <Animated.View
              style={[
                styles.ovalContainer,
                {
                  transform: [{ scale: faceInOval ? 1 : pulseAnim }],
                },
              ]}
            >
              <View
                style={[
                  styles.oval,
                  {
                    borderColor: getOvalColor(),
                    borderWidth: faceInOval ? 3 : 2,
                    borderStyle: faceDetected ? "solid" : "dashed",
                  },
                ]}
              >
                {/* Cantos do oval */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                {/* Instrução dentro do oval */}
                {!faceInOval && faceDetected && (
                  <Animated.View
                    style={[
                      styles.arrowContainer,
                      { transform: [{ translateY: bounceAnim }] },
                    ]}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={32}
                      color={colors.warning}
                    />
                    <Text style={styles.arrowText}>Entre aqui</Text>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Status e Instruções */}
          <View style={styles.bottomContainer}>
            {/* Contador regressivo */}
            {countdown > 0 && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}

            {/* Mensagem de instrução */}
            <View style={styles.instructionBox}>
              {funcionarioNome && faceInOval && (
                <Text style={styles.instructionName}>
                  Olá, {funcionarioNome}!
                </Text>
              )}
              <Text style={styles.instructionText}>{getInstructionText()}</Text>
            </View>

            {/* Indicador de sorriso */}
            {solicitarSorriso && faceInOval && (
              <View
                style={[
                  styles.smileBadge,
                  smileDetected
                    ? styles.smileBadgeSuccess
                    : styles.smileBadgeWarning,
                ]}
              >
                <Ionicons
                  name={smileDetected ? "happy" : "happy-outline"}
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.smileText}>
                  {smileDetected ? "Sorriso OK!" : "Sorria"}
                </Text>
              </View>
            )}

            {/* Indicadores de status */}
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: faceDetected
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
                      backgroundColor: faceInOval
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
                        backgroundColor: smileDetected
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
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
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
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: "#ffffff",
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
  arrowContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -40 }],
    alignItems: "center",
  },
  arrowText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
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
  instructionName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  smileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  smileBadgeSuccess: {
    backgroundColor: colors.success,
  },
  smileBadgeWarning: {
    backgroundColor: colors.warning,
  },
  smileText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
