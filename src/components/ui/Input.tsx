// src/components/ui/Input.tsx
import React from "react";
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { colors } from "../../constants/colors";

interface InputProps extends TextInputProps {
  error?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.muted.light}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: colors.background.light,
    color: colors.text.light,
  },
  inputError: {
    borderColor: colors.destructive.light,
  },
});
