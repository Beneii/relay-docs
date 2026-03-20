import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/theme";

interface AnimatedToggleProps {
  value: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}

export function AnimatedToggle({ value, onToggle, style }: AnimatedToggleProps) {
  const { colors } = useTheme();
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [value, animValue]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  const bgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  return (
    <Pressable onPress={onToggle} style={style}>
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View
          style={[styles.knob, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
