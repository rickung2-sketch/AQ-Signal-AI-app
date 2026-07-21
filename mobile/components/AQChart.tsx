import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { Monospace, Body, Label } from './Typography';

interface AQChartProps {
  symbol: string;
  direction?: 'BUY' | 'SELL';
  points?: number[];
}

export function AQChart({ symbol, direction = 'BUY', points = [10, 25, 18, 42, 35, 60, 52, 78, 70, 95] }: AQChartProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
  }, [symbol]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const isBuy = direction === 'BUY';
  const chartColor = isBuy ? colors.gold : '#FF5252';

  // Normalize points to values from 10 to 90 for percentage layout
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;
  const normalizedY = points.map(p => 90 - ((p - minVal) / range) * 80);

  return (
    <View style={styles.container}>
      {/* Chart Title / Price Stats */}
      <View style={styles.chartHeader}>
        <View>
          <Label style={styles.chartTitle}>{symbol} HIGH-FIDELITY FEED</Label>
          <Monospace style={styles.timeframeText}>15M TIMEFRAME • LIQUIDITY MAP</Monospace>
        </View>
        <View style={styles.priceStat}>
          <Monospace style={[styles.priceText, { color: chartColor }]}>
            {isBuy ? '▲ IMPULSIVE CONTINUATION' : '▼ STRUCTURAL LIQUIDATION'}
          </Monospace>
          <Monospace style={styles.latencyText}>LATENCY: 14MS</Monospace>
        </View>
      </View>

      {/* Main Chart Canvas Grid */}
      <View style={styles.chartCanvas}>
        {/* Horizontal grid lines */}
        <View style={[styles.gridLine, { top: '20%' }]} />
        <View style={[styles.gridLine, { top: '40%' }]} />
        <View style={[styles.gridLine, { top: '60%' }]} />
        <View style={[styles.gridLine, { top: '80%' }]} />

        {/* Vertical grid lines */}
        <View style={[styles.vGridLine, { left: '25%' }]} />
        <View style={[styles.vGridLine, { left: '50%' }]} />
        <View style={[styles.vGridLine, { left: '75%' }]} />

        {/* Connecting Line Segments */}
        <Animated.View style={[styles.lineMaskContainer, animatedStyle]}>
          <View style={styles.fullWidthCanvas}>
            {normalizedY.map((y, index) => {
              if (index === 0) return null;
              const prevY = normalizedY[index - 1];
              const prevX = ((index - 1) / (normalizedY.length - 1)) * 100;
              const currX = (index / (normalizedY.length - 1)) * 100;
              
              // Calculate distance and angle between points
              const dx = currX - prevX;
              const dy = y - prevY;
              
              // Map percentages to actual container layout measurements (roughly 300px wide, 140px high)
              const widthRatio = dx * 3.0; // scale percentage to roughly canvas width
              const heightDiff = dy * 1.4; // scale percentage to roughly canvas height
              const length = Math.sqrt(widthRatio * widthRatio + heightDiff * heightDiff);
              const angleRad = Math.atan2(heightDiff, widthRatio);
              const angleDeg = (angleRad * 180) / Math.PI;

              return (
                <View
                  key={index}
                  style={[
                    styles.lineSegment,
                    {
                      left: `${prevX}%`,
                      top: `${prevY}%`,
                      width: length,
                      transform: [{ rotate: `${angleDeg}deg` }],
                      backgroundColor: chartColor,
                    },
                  ]}
                />
              );
            })}

            {/* Glowing nodes on peaks */}
            {normalizedY.map((y, index) => {
              if (index === 0 || index === normalizedY.length - 1 || index % 3 !== 0) return null;
              return (
                <View
                  key={`node-${index}`}
                  style={[
                    styles.nodeDot,
                    {
                      left: `${(index / (normalizedY.length - 1)) * 100}%`,
                      top: `${y}%`,
                      backgroundColor: colors.background,
                      borderColor: chartColor,
                    }
                  ]}
                />
              );
            })}

            {/* Target and Stop levels markers */}
            <View style={[styles.levelLine, { top: `${normalizedY[normalizedY.length - 1]}%`, borderColor: `${chartColor}88` }]}>
              <View style={[styles.levelBadge, { backgroundColor: chartColor }]}>
                <Monospace style={styles.levelBadgeText}>CMP</Monospace>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Chart Footer Scales */}
      <View style={styles.chartFooter}>
        <Monospace style={styles.footerScale}>20:45</Monospace>
        <Monospace style={styles.footerScale}>21:00</Monospace>
        <Monospace style={styles.footerScale}>21:15</Monospace>
        <Monospace style={styles.footerScale}>21:30</Monospace>
        <Monospace style={styles.footerScale}>21:45</Monospace>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070707',
    borderWidth: 1,
    borderColor: '#1C1C1C',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
    paddingBottom: 8,
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.2,
  },
  timeframeText: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 2,
  },
  priceStat: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 8,
    fontWeight: '800',
  },
  latencyText: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 2,
  },
  chartCanvas: {
    height: 140,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#030303',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#111',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#121212',
    borderStyle: 'dashed',
  },
  vGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#121212',
  },
  lineMaskContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  fullWidthCanvas: {
    width: Dimensions.get('window').width - 56, // Accurate canvas sizing
    height: '100%',
    position: 'relative',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'top left',
    opacity: 0.85,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  nodeDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    marginLeft: -3,
    marginTop: -3,
    zIndex: 5,
  },
  levelLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
  },
  levelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 4,
    marginTop: -6,
  },
  levelBadgeText: {
    fontSize: 6,
    fontWeight: '900',
    color: '#000',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerScale: {
    fontSize: 7,
    color: colors.textMuted,
  },
});
