import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// NEW: Animated Image wrapper (so Reanimated can animate it)
const AnimatedImage = Animated.createAnimatedComponent(Image);

type NeedleGaugeProps = {
  value: number;        // 0–1, probability of RIGHT team
  leftLabel?: string;
  rightLabel?: string;
  minAngle?: number;
  maxAngle?: number;
  duration?: number;
  size?: number;
  leftImageUrl?: string;   // <- Team A logo/profile URL
  rightImageUrl?: string;  // <- Team B logo/profile URL
};

export const NeedleGauge: React.FC<NeedleGaugeProps> = ({
  value,
  leftLabel = "Away",
  rightLabel = "Home",
  minAngle = -90,
  maxAngle = 90,
  duration = 1000,
  size = 220,
  leftImageUrl,
  rightImageUrl,
}) => {
  const dialSize = size;
  const needleLength = dialSize / 2 - 5;

  const angle = useSharedValue(minAngle);
  const fill = useSharedValue(value); // 0–1, used for background blend

  const clamped = Math.max(0, Math.min(1, value));
  const targetAngle = minAngle + (maxAngle - minAngle) * clamped;

  useEffect(() => {
    angle.value = withTiming(targetAngle, { duration });
    fill.value = withTiming(clamped, { duration });
  }, [targetAngle, clamped, duration]);

  // needle rotation
  const needleContainerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  // CHANGED: backgrounds now animate opacity instead of width
  const leftBgStyle = useAnimatedStyle(() => ({
    opacity: 1 - fill.value, // 1 when value = 0
  }));

  const rightBgStyle = useAnimatedStyle(() => ({
    opacity: fill.value, // 1 when value = 1
  }));

  const percent = (clamped * 100).toFixed(1);
  const winningTeam = clamped >= 0.5 ? rightLabel : leftLabel;
  const displayedPercent =
    clamped >= 0.5 ? percent : (100 - parseFloat(percent)).toFixed(1);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.labelsRow,
          { maxWidth: dialSize + 60 },
        ]}
      >
        {/* you can put labels here again if you want */}
      </View>

      <View style={[styles.dialWrapper, { width: dialSize, height: dialSize / 2 }]}>
        <View style={[styles.semiClip, { width: dialSize, height: dialSize / 2 }]}>
          <View
            style={[
              styles.dialBackground,
              { width: dialSize, height: dialSize, borderRadius: dialSize / 2 },
            ]}
          >
            {/* NEW: full-size centered logos that cross-fade */}
            {leftImageUrl && (
              <AnimatedImage
                source={{ uri: leftImageUrl }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { width: dialSize, height: dialSize },
                  leftBgStyle,
                ]}
                resizeMode="contain"  // keeps logo centered & fully visible
              />
            )}

            {rightImageUrl && (
              <AnimatedImage
                source={{ uri: rightImageUrl }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { width: dialSize, height: dialSize },
                  rightBgStyle,
                ]}
                resizeMode="contain"
              />
            )}

            {/* optional: dark overlay so logos don't overpower needle */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(2,6,23,0.70)" },
              ]}
            />

            {/* Rotating container, centered in the circle */}
            <Animated.View
              style={[
                styles.needleContainer,
                { width: dialSize, height: dialSize },
                needleContainerStyle,
              ]}
            >
              {/* Needle whose base is at the center of the dial */}
              <View
                style={[
                  styles.needle,
                  { bottom: dialSize / 2, height: needleLength },
                ]}
              />
            </Animated.View>
          </View>
        </View>
      </View>

      <View style={styles.percentRow}>
        <Text style={styles.percentText}>
          {displayedPercent}% {winningTeam}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 6,
  },
  labelsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  teamLabel: {
    color: "#e5e7eb",
    fontSize: 12,
  },
  dialWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  semiClip: {
    overflow: "hidden",
  },
  dialBackground: {
    backgroundColor: "#020617",
    borderWidth: 2,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden", // important for clipping to the circle
  },

  // (sideBg / leftSide / rightSide no longer used but safe to keep or delete)
  sideBg: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  leftSide: { left: 0 },
  rightSide: { right: 0 },

  // This fills the whole circle; its center is the rotation pivot
  needleContainer: {
    position: "absolute",
  },

  // Base of the needle is at the circle center
  needle: {
    position: "absolute",
    alignSelf: "center",
    width: 2,
    backgroundColor: "#f97316",
    borderRadius: 9999,
  },

  percentRow: {
    marginTop: 2,
  },
  percentText: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "600",
  },
});
