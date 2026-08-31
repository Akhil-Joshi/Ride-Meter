import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Filter, FeDropShadow } from 'react-native-svg';
import CYANIDE_THEME from '../constants/colors';
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
  const { settings, theme } = useSettings();

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
        stroke={isMajor ? CYANIDE_THEME.gaugeTickMajor : CYANIDE_THEME.gaugeTickMinor}
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
          fill={CYANIDE_THEME.textSecondary}
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
  const needleLen = radius - 30;
  const needleTip = polarToCartesian(center, center, needleLen, currentAngle);
  const needleBase1 = polarToCartesian(center, center, 10, currentAngle + 90);
  const needleBase2 = polarToCartesian(center, center, 10, currentAngle - 90);

  const needlePath = `M ${needleBase1.x} ${needleBase1.y} L ${needleTip.x} ${needleTip.y} L ${needleBase2.x} ${needleBase2.y} Z`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={CYANIDE_THEME.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={CYANIDE_THEME.primaryGlow} stopOpacity="0.8" />
          </LinearGradient>

          <LinearGradient id="alertGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={CYANIDE_THEME.danger} stopOpacity="1" />
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

        {/* Center Needle Cap */}
        <Circle
          cx={center}
          cy={center}
          r="14"
          fill={theme.card}
          stroke={isAlert ? theme.danger : theme.primary}
          strokeWidth="3"
        />
        <Circle cx={center} cy={center} r="5" fill={theme.primaryGlow} />
      </Svg>

      {/* Digital Speed Center Readout */}
      <View style={styles.centerReadout}>
        <Text style={[styles.speedText, { color: theme.textPrimary }, isAlert && styles.speedTextAlert]}>
          {Math.round(speed)}
        </Text>
        <Text style={[styles.unitText, { color: theme.primary }, isAlert && styles.unitTextAlert]}>
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
  centerReadout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 145,
  },
  speedText: {
    fontFamily: 'monospace',
    fontSize: 54,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: -2,
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  speedTextAlert: {
    color: CYANIDE_THEME.danger,
    textShadowColor: 'rgba(239, 68, 68, 0.8)',
  },
  unitText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: CYANIDE_THEME.primary,
    letterSpacing: 2,
    marginTop: -4,
  },
  unitTextAlert: {
    color: CYANIDE_THEME.danger,
  },
});
