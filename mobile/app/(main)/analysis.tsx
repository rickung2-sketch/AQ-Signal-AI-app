import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Heading, Subheading, Body, Label, GoldAccent, Monospace } from '../../components/Typography';
import { Button } from '../../components/Button';
import { AQChart } from '../../components/AQChart';
import {
  Compass,
  Cpu,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart2,
  CheckCircle,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface AnalysisMetric {
  name: string;
  value: string;
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export default function AnalysisScreen() {
  const [selectedAsset, setSelectedAsset] = useState<'XAU/USD' | 'BTC/USD' | 'EUR/USD'>('XAU/USD');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const assetMetrics: Record<'XAU/USD' | 'BTC/USD' | 'EUR/USD', {
    symbol: string;
    direction: 'BUY' | 'SELL';
    consensus: number;
    timeframes: { tf: string; signal: 'BUY' | 'SELL' | 'HOLD'; strength: number }[];
    indicators: AnalysisMetric[];
    aiExecutiveSummary: string;
    targetZone: string;
    riskScore: string;
    chartPoints: number[];
    detailedSteps: { phase: string; details: string; value: string }[];
    neuralSign: string;
  }> = {
    'XAU/USD': {
      symbol: 'XAU/USD (Gold)',
      direction: 'BUY',
      consensus: 94.8,
      timeframes: [
        { tf: '15M', signal: 'BUY', strength: 92 },
        { tf: '1H', signal: 'BUY', strength: 88 },
        { tf: '4H', signal: 'BUY', strength: 95 },
        { tf: 'D', signal: 'HOLD', strength: 60 }
      ],
      indicators: [
        { name: 'RSI (14)', value: '62.4 (Oversold exit)', status: 'BULLISH' },
        { name: 'MACD (12, 26)', value: 'Bullish Crossover', status: 'BULLISH' },
        { name: 'Moving Averages', value: 'EMA-50 > EMA-200', status: 'BULLISH' },
        { name: 'Bollinger Bands', value: 'Mid-band rebound', status: 'NEUTRAL' }
      ],
      aiExecutiveSummary: 'XAU/USD demonstrates substantial bullish impulse. Structural liquidations have swept the sub-2400 level, validating institutional buyer presence. Expect ongoing trend continuation with targets set toward the 2445 liquidity pool.',
      targetZone: '2410.50 - 2425.00',
      riskScore: 'LOW (1.2)',
      chartPoints: [2385, 2392, 2389, 2404, 2401, 2415, 2410, 2428, 2422, 2435],
      detailedSteps: [
        { phase: 'Phase I: Accumulation', details: 'Institutional blocks verified entering orders inside the 2408-2415 structural block.', value: '2410.50' },
        { phase: 'Phase II: Stop Liquidity', details: 'SL set beneath the recent 4H swing-low to mitigate institutional sweeps.', value: '2395.00' },
        { phase: 'Phase III: Expansion Target', details: 'Primary liquidations target the high-volume-node resistance pool.', value: '2445.00' }
      ],
      neuralSign: 'AQ-NET-XAU-889a9f2'
    },
    'BTC/USD': {
      symbol: 'BTC/USD (Bitcoin)',
      direction: 'SELL',
      consensus: 81.2,
      timeframes: [
        { tf: '15M', signal: 'SELL', strength: 80 },
        { tf: '1H', signal: 'SELL', strength: 75 },
        { tf: '4H', signal: 'HOLD', strength: 55 },
        { tf: 'D', signal: 'BUY', strength: 70 }
      ],
      indicators: [
        { name: 'RSI (14)', value: '41.2 (Slight bearish)', status: 'BEARISH' },
        { name: 'MACD (12, 26)', value: 'Bearish continuation', status: 'BEARISH' },
        { name: 'Moving Averages', value: 'EMA-20 Rejection', status: 'BEARISH' },
        { name: 'Bollinger Bands', value: 'Lower band squeeze', status: 'NEUTRAL' }
      ],
      aiExecutiveSummary: 'Bitcoin remains in a tight distribution block. Minor support at 63,500 has repeatedly held, but lack of volume suggests a potential sweep of local liquidity before any sustainable upward reversal.',
      targetZone: '62,800 - 64,200',
      riskScore: 'MEDIUM (2.4)',
      chartPoints: [64500, 64200, 64350, 63800, 63900, 63100, 63400, 62700, 63000, 62400],
      detailedSteps: [
        { phase: 'Phase I: Liquidity Siphon', details: 'Rejection at high-volume nodes prompts early capital distribution out of spot assets.', value: '63,800' },
        { phase: 'Phase II: Distribution Block', details: 'Stop boundaries set closely above the local consolidation peak structure.', value: '64,500' },
        { phase: 'Phase III: Mitigation Target', details: 'A sweep of late buyer leverage at the immediate order block liquidity target.', value: '61,800' }
      ],
      neuralSign: 'AQ-NET-BTC-1029cbb3'
    },
    'EUR/USD': {
      symbol: 'EUR/USD (Euro / US Dollar)',
      direction: 'SELL',
      consensus: 88.5,
      timeframes: [
        { tf: '15M', signal: 'SELL', strength: 85 },
        { tf: '1H', signal: 'SELL', strength: 90 },
        { tf: '4H', signal: 'SELL', strength: 88 },
        { tf: 'D', signal: 'SELL', strength: 82 }
      ],
      indicators: [
        { name: 'RSI (14)', value: '34.8 (Approaching oversold)', status: 'BEARISH' },
        { name: 'MACD (12, 26)', value: 'Strong momentum down', status: 'BEARISH' },
        { name: 'Moving Averages', value: 'Death cross confirmed', status: 'BEARISH' },
        { name: 'Bollinger Bands', value: 'Riding lower band', status: 'BEARISH' }
      ],
      aiExecutiveSummary: 'The Euro is exhibiting clear structural weakness against the USD. Continued macro economic pressures are driving capital into treasuries, reinforcing daily order block resistance. Sell-on-rallies is highly favored.',
      targetZone: '1.08200 - 1.08900',
      riskScore: 'VERY LOW (0.8)',
      chartPoints: [1.092, 1.090, 1.091, 1.088, 1.089, 1.085, 1.086, 1.082, 1.083, 1.079],
      detailedSteps: [
        { phase: 'Phase I: Trend Rejection', details: 'Death cross confirmed on the 4H timeframe, affirming strong bearish control.', value: '1.0892' },
        { phase: 'Phase II: Risk Ceiling', details: 'Stop-loss anchored above the immediate liquidity pool block ceiling.', value: '1.0945' },
        { phase: 'Phase III: Expansion Goal', details: 'Long-term support target aligned with the high timeframe pivot line.', value: '1.0780' }
      ],
      neuralSign: 'AQ-NET-EUR-ff230a11'
    }
  };

  const currentData = assetMetrics[selectedAsset];

  return (
    <View style={styles.container}>
      {/* Asset Selector Row */}
      <View style={styles.tabSelector}>
        {(['XAU/USD', 'BTC/USD', 'EUR/USD'] as const).map((asset) => (
          <TouchableOpacity
            key={asset}
            onPress={() => setSelectedAsset(asset)}
            style={[styles.tabButton, selectedAsset === asset && styles.activeTabButton]}
          >
            <Body style={[styles.tabButtonText, selectedAsset === asset && styles.activeTabButtonText]}>
              {asset}
            </Body>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Signal Summary & Overview Header */}
        <Animated.View entering={FadeIn.duration(600)}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Heading style={styles.symbolHeading}>{currentData.symbol}</Heading>
                <Label style={styles.summaryLabel}>CONSENSUS SIGNAL SUMMARY</Label>
              </View>
              <View style={[styles.signalTypeBadge, currentData.direction === 'BUY' ? styles.buyBg : styles.sellBg]}>
                <Body style={styles.signalTypeText}>{currentData.direction}</Body>
              </View>
            </View>

            <View style={styles.consensusBox}>
              <View style={styles.consensusItem}>
                <Label style={styles.conLabel}>NEURAL SCORE</Label>
                <Heading style={[styles.conValue, { color: colors.gold }]}>{currentData.consensus}%</Heading>
              </View>
              <View style={styles.consensusItem}>
                <Label style={styles.conLabel}>RISK RATIO</Label>
                <Heading style={styles.conValue}>{currentData.riskScore}</Heading>
              </View>
              <View style={styles.consensusItem}>
                <Label style={styles.conLabel}>STATUS</Label>
                <Heading style={[styles.conValue, styles.activeTxt]}>VERIFIED</Heading>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* High-Fidelity Chart Snapshot */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Label style={styles.sectionTitle}>HIGH-FIDELITY LIQUIDITY PLOT</Label>
          <AQChart symbol={selectedAsset} direction={currentData.direction} points={currentData.chartPoints} />
        </Animated.View>

        {/* Trade Levels & Execution Blueprint */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Label style={styles.sectionTitle}>TACTICAL TRADE LEVELS BLUEPRINT</Label>
          <Card style={styles.blueprintCard}>
            {currentData.detailedSteps.map((step, i) => (
              <View key={i} style={[styles.blueprintStep, i === currentData.detailedSteps.length - 1 && styles.noBorder]}>
                <View style={styles.stepMeta}>
                  <View style={styles.stepNumBadge}>
                    <Monospace style={styles.stepNumText}>0{i + 1}</Monospace>
                  </View>
                  <View style={styles.stepTitleBox}>
                    <Subheading style={styles.stepPhase}>{step.phase}</Subheading>
                    <Body style={styles.stepDetails}>{step.details}</Body>
                  </View>
                </View>
                <View style={styles.stepPriceBox}>
                  <Monospace style={styles.stepPriceVal}>{step.value}</Monospace>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* AQ Verify: Core Neural Verification Shield */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Card hasGoldBorder style={styles.verifyCard}>
            <View style={styles.verifyHeader}>
              <ShieldCheck size={18} color={colors.gold} />
              <Subheading style={styles.verifyTitle}>AQ VERIFY • SECURE PROTOCOL</Subheading>
            </View>
            <View style={styles.verifyGrid}>
              <View style={styles.verifyRow}>
                <Body style={styles.verifyLabel}>Neural Classifier Model</Body>
                <Monospace style={styles.verifyValue}>AQ-Alpha-v5.9_DeepNet</Monospace>
              </View>
              <View style={styles.verifyRow}>
                <Body style={styles.verifyLabel}>Validation Signature</Body>
                <Monospace style={[styles.verifyValue, { color: '#4CAF50' }]}>SECURE_SHA-256_PASS</Monospace>
              </View>
              <View style={styles.verifyRow}>
                <Body style={styles.verifyLabel}>Core Cryptographic Hash</Body>
                <Monospace style={[styles.verifyValue, { color: colors.gold }]}>{currentData.neuralSign}</Monospace>
              </View>
              <View style={styles.verifyRow}>
                <Body style={styles.verifyLabel}>Database Node Ingress</Body>
                <Monospace style={styles.verifyValue}>CLOUD-NODE-ENG-WEST_2</Monospace>
              </View>
            </View>

            <View style={styles.assuranceNote}>
              <Info size={12} color={colors.textMuted} />
              <Body style={styles.assuranceText}>
                Verified autonomous trade directive. Neural consensus validated in full by the centralized AQ Oracle array.
              </Body>
            </View>
          </Card>
        </Animated.View>

        {/* Timeframe Trend Consensus */}
        <Label style={styles.sectionTitle}>TIMEFRAME TREND CONSENSUS</Label>
        <View style={styles.timeframeRow}>
          {currentData.timeframes.map((tfData) => {
            const isBuy = tfData.signal === 'BUY';
            const isSell = tfData.signal === 'SELL';
            
            return (
              <Card key={tfData.tf} style={styles.timeframeCard}>
                <Label style={styles.tfLabel}>{tfData.tf}</Label>
                <Heading style={[
                  styles.tfSignal,
                  isBuy ? styles.successText : isSell ? styles.errorText : styles.neutralText
                ]}>
                  {tfData.signal}
                </Heading>
                <Monospace style={styles.tfStrength}>{tfData.strength}% ACC</Monospace>
              </Card>
            );
          })}
        </View>

        {/* Technical Indicators summary */}
        <Label style={styles.sectionTitle}>HIGH-FIDELITY TECHNICAL AUDIT</Label>
        {currentData.indicators.map((metric, i) => {
          const isBull = metric.status === 'BULLISH';
          const isBear = metric.status === 'BEARISH';
          
          return (
            <Card key={i} style={styles.indicatorRow}>
              <View style={styles.indicatorMeta}>
                <Activity size={13} color={colors.gold} />
                <Body style={styles.indicatorName}>{metric.name}</Body>
              </View>
              <View style={styles.indicatorResult}>
                <Body style={styles.indicatorValue}>{metric.value}</Body>
                <View style={[
                  styles.statusBadge,
                  isBull ? styles.bullBadge : isBear ? styles.bearBadge : styles.neutBadge
                ]}>
                  <Body style={styles.statusBadgeText}>{metric.status}</Body>
                </View>
              </View>
            </Card>
          );
        })}
        
        <View style={styles.complianceNote}>
          <Body style={styles.complianceNoteText}>
            All analytical outputs are fully autonomous calculations generated in real-time by the AQ Trade AI neural networks. These are mock signals and insights for educational and simulation use only.
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  activeTabButton: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.gold,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    marginTop: spacing.sm,
    backgroundColor: '#0A0A0A',
    borderColor: '#1C1C1C',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  symbolHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  signalTypeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buyBg: {
    backgroundColor: colors.gold,
  },
  sellBg: {
    backgroundColor: '#FF5252',
  },
  signalTypeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  consensusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consensusItem: {
    flex: 1,
    alignItems: 'center',
  },
  conLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 4,
  },
  conValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  activeTxt: {
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.gold,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  blueprintCard: {
    backgroundColor: '#080808',
    borderColor: '#181818',
    padding: 0,
    overflow: 'hidden',
  },
  blueprintStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.gold,
  },
  stepTitleBox: {
    marginLeft: spacing.md,
    flex: 1,
  },
  stepPhase: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  stepDetails: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  stepPriceBox: {
    alignItems: 'flex-end',
  },
  stepPriceVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
  },
  verifyCard: {
    backgroundColor: '#070707',
    borderColor: '#2C2614',
    padding: spacing.lg,
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  verifyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  verifyGrid: {
    marginTop: spacing.xs,
  },
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  verifyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  verifyValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  assuranceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0C0C',
    borderRadius: 4,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#181818',
  },
  assuranceText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    marginLeft: spacing.sm,
    flex: 1,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeCard: {
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#070707',
    borderColor: '#191919',
  },
  tfLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
  },
  tfSignal: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  tfStrength: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#FF5252',
  },
  neutralText: {
    color: '#FFC107',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: spacing.md,
    backgroundColor: '#070707',
    borderColor: '#191919',
  },
  indicatorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorName: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  indicatorResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorValue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bullBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  bearBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  neutBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.08)',
    borderWidth: 1,
    borderColor: '#9E9E9E',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  complianceNote: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  complianceNoteText: {
    textAlign: 'center',
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 14,
  },
});
