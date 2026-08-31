import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useSettings } from '../context/SettingsContext';

interface SpeedometerGaugeProps {
  speed: number; // in current unit or km/h
  maxRange?: number; // default 200
  isAlert?: boolean;
  unitLabel?: string;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  speed,
  maxRange = 200,
  isAlert = false,
  unitLabel = 'KM/H',
}) => {
  const { theme } = useSettings();

  const size = 300;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 16;

  // Arc angles: -125° to +125° (Total 250°)
  const startAngle = -125;
  const endAngle = 125;
  const angleRange = endAngle - startAngle;

  const currentSpeedClamped = Math.min(Math.max(0, speed), maxRange);
  const currentAngle = startAngle + (currentSpeedClamped / maxRange) * angleRange;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Background Arc
  const bgArcPath = describeArc(center, center, radius, startAngle, endAngle);

  // Active Speed Fill Arc
  const activeArcPath = describeArc(
    center,
    center,
    radius,
    startAngle,
    Math.max(startAngle + 0.1, currentAngle)
  );

  // Generate Tick Marks & Numbers
  const ticks = [];
  const majorStep = 20;
  const minorStep = 4;

  for (let val = 0; val <= maxRange; val += minorStep) {
    const isMajor = val % majorStep === 0;
    const tickAngle = startAngle + (val / maxRange) * angleRange;

    const outerR = radius - 10;
    const innerR = isMajor ? radius - 24 : radius - 17;

    const p1 = polarToCartesian(center, center, outerR, tickAngle);
    const p2 = polarToCartesian(center, center, innerR, tickAngle);

    ticks.push(
      <Line
        key={`tick-${val}`}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isMajor ? theme.gaugeTickMajor : theme.gaugeTickMinor}
        strokeWidth={isMajor ? 2.5 : 1.2}
      />
    );

    if (isMajor) {
      const textR = radius - 38;
      const textPos = polarToCartesian(center, center, textR, tickAngle);
      ticks.push(
        <SvgText
          key={`text-${val}`}
          x={textPos.x}
          y={textPos.y + 4}
          fill={theme.textSecondary}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {val}
        </SvgText>
      );
    }
  }

  // Calculate Needle Coordinates
  const needleLen = radius - 32;
  const needleTip = polarToCartesian(center, center, needleLen, currentAngle);
  const needleBase1 = polarToCartesian(center, center, 8, currentAngle + 90);
  const needleBase2 = polarToCartesian(center, center, 8, currentAngle - 90);

  const needlePath = `M ${needleBase1.x} ${needleBase1.y} L ${needleTip.x} ${needleTip.y} L ${needleBase2.x} ${needleBase2.y} Z`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={theme.primaryGlow} stopOpacity="0.8" />
          </LinearGradient>

          <LinearGradient id="alertGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.danger} stopOpacity="1" />
            <Stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* Outer Background Arc */}
        <Path
          d={bgArcPath}
          stroke={theme.gaugeArcBg}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Active Speed Arc */}
        <Path
          d={activeArcPath}
          stroke={isAlert ? 'url(#alertGlow)' : 'url(#cyanGlow)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Glowing Rim */}
        <Circle
          cx={center}
          cy={center}
          r={radius - 46}
          stroke={isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)'}
          strokeWidth="2"
          fill="none"
        />

        {/* Tick Marks & Values */}
        {ticks}

        {/* Dynamic Needle Blade */}
        <Path
          d={needlePath}
          fill={isAlert ? theme.danger : theme.primary}
          opacity={0.9}
        />

        {/* Center Needle Cap Pivot Pin */}
        <Circle
          cx={center}
          cy={center}
          r="10"
          fill={theme.card}
          stroke={isAlert ? theme.danger : theme.primary}
          strokeWidth="2.5"
        />
        <Circle cx={center} cy={center} r="4" fill={theme.primaryGlow} />
      </Svg>

      {/* Digital Speed Display Pod (Positioned cleanly below the needle pivot pin) */}
      <View
        style={[
          styles.digitalPod,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          isAlert && { borderColor: theme.danger },
        ]}
      >
        <Text style={[styles.speedText, { color: theme.textPrimary }, isAlert && { color: theme.danger }]}>
          {Math.round(speed)}
        </Text>
        <Text style={[styles.unitText, { color: theme.primary }, isAlert && { color: theme.danger }]}>
          {unitLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  digitalPod: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 230,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 100,
  },
  speedText: {
    fontFamily: 'monospace',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 46,
  },
  unitText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -2,
  },
});
