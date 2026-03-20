import React, { useRef, useCallback } from "react";
import {
  Animated,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
  StyleProp,
} from "react-native";

interface PressableScaleProps {
  activeScale?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  onPressIn?: (e: GestureResponderEvent) => void;
  onPressOut?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  android_ripple?: { color: string };
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

export function PressableScale({
  activeScale = 0.97,
  children,
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  android_ripple,
  hitSlop,
}: PressableScaleProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scaleValue, {
        toValue: activeScale,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
      onPressIn?.(e);
    },
    [scaleValue, activeScale, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }).start();
      onPressOut?.(e);
    },
    [scaleValue, onPressOut]
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={android_ripple}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style as ViewStyle, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
