import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { RelayLogo } from "@/components/RelayLogo";

export function LoadingScreen() {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: pulseAnim }}>
        <RelayLogo size={40} color={colors.accent} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
