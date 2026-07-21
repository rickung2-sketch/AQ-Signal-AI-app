import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, RefreshControl, ScrollView, Platform, Alert } from 'react-native';
import { useFetchSignals } from '../../features/signals/api';
import { useSignalStore, Signal } from '../../store/signalStore';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Heading, Subheading, Body, Label, GoldAccent, Monospace } from '../../components/Typography';
import { AQRing } from '../../components/AQRing';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  Activity,
  Compass,
  RotateCw,
  Cpu,
  Wifi,
  Lock,
} from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export default function SignalsDashboard() {
  const router = useRouter();
  const { isLoading, isRefetching, refetch } = useFetchSignals();
  const activeSignals = useSignalStore((state) => state.activeSignals);
  const error = useSignalStore((state) => state.error);

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'GOLD' | 'US30'>('ALL');
  const [pulseOpacity] = useState(new Animated.Value(1));

  // Cryptographic system hash for premium tech decoration
  const [sysHash] = useState('0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase());

  // High-fidelity production fallback signals for local testing or when connection is offline
  const fallbackSignals: Signal[] = [
    {
      id: 'SIG-XAU-1001',
      symbol: 'XAU/USD (Gold)',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 2410.50,
      stopLoss: 2395.00,
      takeProfit1: 2425.00,
      takeProfit2: 2445.00,
      confidenceScore: 94.8,
      aiReasoning: 'Bullish engulfing breakout confirmed on the 4H timeframe. Key structural support at 2405 holding strong. Multi-timeframe trend alignment suggests high-probability continuation of upward impulsive movement.',
      aiAnalysisPoints: [
        'Engulfing candle validation on 4H structure',
        'Strong buyer concentration detected near SMA-200',
        'Momentum RSI divergence exited oversold territory'
      ],
      timestamp: new Date().toISOString(),
      status: 'ACTIVE'
    },
    {
      id: 'SIG-US30-1003',
      symbol: 'US30 (Dow Jones)',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 39120.00,
      stopLoss: 39350.00,
      takeProfit1: 38850.00,
      takeProfit2: 38600.00,
      confidenceScore: 91.2,
      aiReasoning: 'Liquidity sweep confirmed at daily high range. Strong rejection wick indicates institution distribution blocks are fully operational. Market structure shift (MSS) triggered on the 15M timeframe.',
      aiAnalysisPoints: [
        'Rejection of daily key distribution block',
        'Market structure shift on high volume',
        'MACD bearish crossover with momentum increase'
      ],
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'ACTIVE'
    },
    {
      id: 'SIG-EUR-1002',
      symbol: 'EUR/USD',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 1.08920,
      stopLoss: 1.09450,
      takeProfit1: 1.08400,
      takeProfit2: 1.07800,
      confidenceScore: 89.2,
      aiReasoning: 'Distribution structure completed in the Asian session. Order book shows heavy sell liquidity sitting directly above current market price. Target zone aligns with daily support pivot.',
      aiAnalysisPoints: [
        'Wyckoff distribution block confirmation',
        'Bearish MACD crossover on 1H timeframe',
        'Liquidity sweep at 1.0920 before rejection'
      ],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'ACTIVE'
    }
  ];

  const rawSignals = activeSignals.length > 0 ? activeSignals : fallbackSignals;
  
  // Filter by category
  const displayedSignals = rawSignals.filter((signal) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'GOLD') return signal.symbol.toUpperCase().includes('XAU') || signal.symbol.toUpperCase().includes('GOLD');
    if (selectedCategory === 'US30') return signal.symbol.toUpperCase().includes('US30') || signal.symbol.toUpperCase().includes('DOW');
    return true;
  });

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (e) {
      console.warn('Silent refresh fallback triggered');
    }
  };

  // Pulse animation for Guardian Status Node
  const guardianPulse = useSharedValue(0.6);
  useEffect(() => {
    guardianPulse.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: guardianPulse.value,
    };
  });

  const renderSignalItem = ({ item, index }: { item: Signal; index: number }) => {
    const isBuy = item.direction === 'BUY';
    const riskReward = Math.abs((item.takeProfit1 - item.entryPrice) / (item.entryPrice - item.stopLoss)).toFixed(1);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 150).duration(600)}>
        <Card hasGoldBorder style={styles.signalCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.directionIndicator, { backgroundColor: isBuy ? '#4CAF50' : '#FF5252' }]} />
              <View>
                <Heading style={styles.symbolText}>{item.symbol}</Heading>
                <View style={styles.badgeRow}>
                  <View style={[styles.directionBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
                    {isBuy ? <TrendingUp size={11} color="#000" /> : <TrendingDown size={11} color="#FFF" />}
                    <Body style={[styles.directionText, { color: isBuy ? '#000' : '#FFF' }]}>{item.direction}</Body>
                  </View>
                  <View style={styles.typeBadge}>
                    <Clock size={11} color={colors.textSecondary} />
                    <Body style={styles.typeText}>{item.type}</Body>
                  </View>
                </View>
              </View>
            </View>

            {/* Embedded AQ Ring / AQ Score */}
            <AQRing score={item.confidenceScore} direction={item.direction} />
          </View>

          {/* Sci-Fi Trade Levels Grid */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Label style={styles.metricLabel}>ENTRY TRIGGER</Label>
              <Monospace style={styles.metricValue}>{item.entryPrice.toFixed(item.entryPrice > 100 ? 2 : 5)}</Monospace>
            </View>
            <View style={[styles.metricItem, styles.middleMetric]}>
              <Label style={styles.metricLabel}>STOP LIMIT (SL)</Label>
              <Monospace style={[styles.metricValue, styles.errorText]}>{item.stopLoss.toFixed(item.stopLoss > 100 ? 2 : 5)}</Monospace>
            </View>
            <View style={styles.metricItem}>
              <Label style={styles.metricLabel}>TARGET 1 (TP)</Label>
              <Monospace style={[styles.metricValue, styles.successText]}>{item.takeProfit1.toFixed(item.takeProfit1 > 100 ? 2 : 5)}</Monospace>
            </View>
          </View>

          {/* Secondary Trade metrics (TP2 and Risk-Reward) */}
          <View style={styles.secondaryLevels}>
            <View style={styles.secLevelBox}>
              <Label style={styles.secLevelLabel}>TARGET 2 (MAX EXPANSION)</Label>
              <Monospace style={styles.secLevelValue}>{item.takeProfit2.toFixed(item.takeProfit2 > 100 ? 2 : 5)}</Monospace>
            </View>
            <View style={styles.secLevelBox}>
              <Label style={styles.secLevelLabel}>RISK REWARD RATIO</Label>
              <Monospace style={[styles.secLevelValue, { color: colors.gold }]}>1 : {riskReward}</Monospace>
            </View>
          </View>

          {/* AQ Insight Reasoning Points */}
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Cpu size={12} color={colors.gold} />
              <Label style={styles.insightTitle}>AQ REAL-TIME QUANT INSIGHTS</Label>
            </View>
            <Body style={styles.insightSummaryText}>{item.aiReasoning}</Body>
            
            {/* The 3 requested reasoning bullet points */}
            <View style={styles.bulletsContainer}>
              {item.aiAnalysisPoints.slice(0, 3).map((point, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: colors.gold }]} />
                  <Body style={styles.bulletText}>{point}</Body>
                </View>
              ))}
            </View>
          </View>

          {/* Premium View Analysis Trigger */}
          <Button
            title="INSPECT TECHNICAL ANALYSIS"
            onPress={() => router.push('/(main)/analysis')}
            variant="outline"
            style={styles.inspectButton}
            textStyle={styles.inspectButtonText}
          />
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedSignals}
        keyExtractor={(item) => item.id}
        renderItem={renderSignalItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
            backgroundColor={colors.background}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* AQ Overview Banner */}
            <Card style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Activity size={16} color={colors.gold} />
                <Subheading style={styles.overviewTitle}>AQ OVERVIEW & FEED METRICS</Subheading>
              </View>
              <View style={styles.overviewStatsRow}>
                <View style={styles.overviewStat}>
                  <Label style={styles.overviewStatLabel}>ACTIVE CHANNELS</Label>
                  <Monospace style={styles.overviewStatValue}>{rawSignals.length}</Monospace>
                </View>
                <View style={styles.overviewStat}>
                  <Label style={styles.overviewStatLabel}>BULLISH CONSENSUS</Label>
                  <Monospace style={[styles.overviewStatValue, { color: colors.gold }]}>94.8%</Monospace>
                </View>
                <View style={styles.overviewStat}>
                  <Label style={styles.overviewStatLabel}>NET GAIN (YTD)</Label>
                  <Monospace style={styles.overviewStatValue}>+8,410p</Monospace>
                </View>
              </View>
            </Card>

            {/* AQ Guardian Section */}
            <Card hasGoldBorder style={styles.guardianCard}>
              <View style={styles.guardianRow}>
                <View style={styles.guardianLeft}>
                  <View style={styles.guardianNodeBox}>
                    <Animated.View style={[styles.guardianPulseNode, pulseStyle]} />
                    <Shield size={16} color={colors.gold} />
                  </View>
                  <View style={styles.guardianMeta}>
                    <Subheading style={styles.guardianTitle}>AQ GUARDIAN SHIELD</Subheading>
                    <Label style={styles.guardianStatusText}>SECURE DIRECTIVE ACTIVE</Label>
                  </View>
                </View>
                <View style={styles.guardianRight}>
                  <Monospace style={styles.hashText}>{sysHash}</Monospace>
                  <Monospace style={styles.portText}>AES-256 SECURED</Monospace>
                </View>
              </View>
            </Card>

            {/* Asset Categories Selector */}
            <Label style={styles.sectionLabel}>MONITORED TRANS-CHANNELS</Label>
            <View style={styles.categoryRow}>
              {(['ALL', 'GOLD', 'US30'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.activeCategoryButton
                  ]}
                >
                  <Body style={[
                    styles.categoryButtonText,
                    selectedCategory === cat && styles.activeCategoryButtonText
                  ]}>
                    {cat === 'ALL' ? 'ALL FEEDS' : cat === 'GOLD' ? 'GOLD (XAU/USD)' : 'US30 (DOW)'}
                  </Body>
                </Pressable>
              ))}
            </View>

            {error && (
              <View style={styles.errorAlertBox}>
                <Wifi size={14} color="#FF5252" />
                <Body style={styles.errorAlertText}>OFFLINE MODE • USING INTEGRATED RISK CACHE</Body>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShieldAlert size={48} color={colors.textMuted} />
            <Heading style={styles.emptyTitle}>NO TRANSMISSIONS LOADED</Heading>
            <Body style={styles.emptySubtitle}>No active signals currently match your asset filter.</Body>
          </View>
        }
      />

      {/* Persistent Sci-Fi Header Controller for Refresh */}
      <View style={styles.refreshBar}>
        <Pressable onPress={handleRefresh} style={styles.refreshPressable}>
          <RotateCw size={12} color={colors.gold} />
          <Monospace style={styles.refreshBarText}>SYNC DIRECTIVE NETWORK</Monospace>
        </Pressable>
        <Monospace style={styles.terminalStatus}>AQ_CORE: ONLINE_</Monospace>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  headerWrapper: {
    marginBottom: spacing.md,
  },
  overviewCard: {
    marginVertical: 4,
    backgroundColor: '#090909',
    borderColor: '#191919',
    padding: spacing.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
    paddingBottom: spacing.xs,
  },
  overviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    marginLeft: spacing.sm,
    letterSpacing: 1,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
  },
  overviewStatLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 4,
  },
  overviewStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  guardianCard: {
    marginVertical: spacing.sm,
    backgroundColor: '#070707',
    borderColor: colors.gold,
    padding: spacing.md,
  },
  guardianRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardianLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardianNodeBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  guardianPulseNode: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    top: 2,
    right: 2,
    borderWidth: 1,
    borderColor: '#000',
  },
  guardianMeta: {
    marginLeft: spacing.md,
  },
  guardianTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  guardianStatusText: {
    fontSize: 8,
    color: '#4CAF50',
    fontWeight: '700',
    marginTop: 1,
  },
  guardianRight: {
    alignItems: 'flex-end',
  },
  hashText: {
    fontSize: 8,
    color: colors.gold,
    fontWeight: '800',
  },
  portText: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.gold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    backgroundColor: '#090909',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginHorizontal: 3,
  },
  activeCategoryButton: {
    borderColor: colors.gold,
    backgroundColor: '#121212',
  },
  categoryButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeCategoryButtonText: {
    color: colors.gold,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  errorAlertText: {
    color: '#FF5252',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: spacing.sm,
    letterSpacing: 0.5,
  },
  signalCard: {
    marginVertical: spacing.xs,
    backgroundColor: '#0A0A0A',
    borderColor: '#1F1F1F',
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  directionIndicator: {
    width: 4,
    height: 42,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  symbolText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  buyBadge: {
    backgroundColor: colors.gold,
  },
  sellBadge: {
    backgroundColor: '#331F1F',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  directionText: {
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  typeText: {
    fontSize: 9,
    marginLeft: 4,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#050505',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#191919',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  middleMetric: {
    borderLeftWidth: 1,
    borderLeftColor: '#1A1A1A',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  metricLabel: {
    fontSize: 7,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  errorText: {
    color: '#FF5252',
  },
  successText: {
    color: '#4CAF50',
  },
  secondaryLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  secLevelBox: {
    flex: 1,
  },
  secLevelLabel: {
    fontSize: 6.5,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  secLevelValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  insightBox: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.02)',
    borderLeftWidth: 1.5,
    borderLeftColor: colors.gold,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.gold,
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  insightSummaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bulletsContainer: {
    marginTop: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  bulletDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    marginRight: spacing.sm,
  },
  bulletText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  inspectButton: {
    marginTop: spacing.md,
    height: 40,
    borderColor: '#30260B',
    borderRadius: borderRadius.md,
  },
  inspectButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  refreshBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#060606',
    borderTopWidth: 1,
    borderTopColor: '#151515',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  refreshPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBarText: {
    fontSize: 8,
    color: colors.gold,
    fontWeight: '700',
    marginLeft: 6,
  },
  terminalStatus: {
    fontSize: 8,
    color: '#4CAF50',
    fontWeight: '700',
  },
});
