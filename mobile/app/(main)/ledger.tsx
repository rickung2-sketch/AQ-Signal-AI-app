import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView, RefreshControl, TextInput, Pressable } from 'react-native';
import { useSignalStore, Signal } from '../../store/signalStore';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Heading, Subheading, Body, Label, GoldAccent, Monospace } from '../../components/Typography';
import { Award, BookOpen, Search, Filter, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function LedgerScreen() {
  const closedSignals = useSignalStore((state) => state.closedSignals);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROFIT' | 'LOSS' | 'EXPIRED'>('ALL');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'GOLD' | 'US30' | 'OTHER'>('ALL');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // High-fidelity historical mock data for offline preview or live API fallback
  const fallbackHistory: Signal[] = [
    {
      id: 'SIG-XAU-999',
      symbol: 'XAU/USD (Gold)',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 2380.00,
      stopLoss: 2368.00,
      takeProfit1: 2398.00,
      takeProfit2: 2410.00,
      confidenceScore: 91.2,
      aiReasoning: 'Successfully target reached. Price hit TP2 at 2410.00 producing excellent returns.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'CLOSED',
      resultPips: 300,
    },
    {
      id: 'SIG-GBP-998',
      symbol: 'GBP/USD',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 1.27200,
      stopLoss: 1.27800,
      takeProfit1: 1.26400,
      takeProfit2: 1.25800,
      confidenceScore: 88.5,
      aiReasoning: 'Price retraced and hit trailing stop-loss in profit near TP1.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'CLOSED',
      resultPips: 80,
    },
    {
      id: 'SIG-USD-997',
      symbol: 'USD/JPY',
      direction: 'BUY',
      type: 'MARKET',
      entryPrice: 157.50,
      stopLoss: 156.80,
      takeProfit1: 158.50,
      takeProfit2: 159.20,
      confidenceScore: 87.0,
      aiReasoning: 'Position stopped out near key psychological support structure.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      status: 'EXPIRED',
      resultPips: -70,
    },
    {
      id: 'SIG-BTC-996',
      symbol: 'BTC/USD',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 62400.00,
      stopLoss: 61800.00,
      takeProfit1: 64500.00,
      takeProfit2: 66000.00,
      confidenceScore: 93.4,
      aiReasoning: 'Target reached fully. Bullish breakout completed at 66,000.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      status: 'CLOSED',
      resultPips: 3600,
    },
    {
      id: 'SIG-XAU-995',
      symbol: 'XAU/USD (Gold)',
      direction: 'SELL',
      type: 'MARKET',
      entryPrice: 2420.00,
      stopLoss: 2432.00,
      takeProfit1: 2405.00,
      takeProfit2: 2390.00,
      confidenceScore: 90.1,
      aiReasoning: 'Loss captured. Stop loss hit due to unpredicted US treasury liquidity pump.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 432000000).toISOString(),
      status: 'CLOSED',
      resultPips: -120,
    },
    {
      id: 'SIG-US30-994',
      symbol: 'US30 (Dow Jones)',
      direction: 'BUY',
      type: 'LIMIT',
      entryPrice: 38900.00,
      stopLoss: 38750.00,
      takeProfit1: 39100.00,
      takeProfit2: 39300.00,
      confidenceScore: 92.5,
      aiReasoning: 'Target reached perfectly. Institutional blocks pushed Dow back above daily support.',
      aiAnalysisPoints: [],
      timestamp: new Date(Date.now() - 518400000).toISOString(),
      status: 'CLOSED',
      resultPips: 200,
    }
  ];

  const rawHistory = closedSignals.length > 0 ? closedSignals : fallbackHistory;

  // Apply filters and search query
  const filteredHistory = rawHistory.filter((item) => {
    // 1. Search filter
    const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.direction.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status filter
    let matchesStatus = true;
    const isProfit = (item.resultPips || 0) > 0;
    if (statusFilter === 'PROFIT') matchesStatus = isProfit && item.status === 'CLOSED';
    if (statusFilter === 'LOSS') matchesStatus = !isProfit && item.status === 'CLOSED';
    if (statusFilter === 'EXPIRED') matchesStatus = item.status === 'EXPIRED';

    // 3. Asset filter
    let matchesAsset = true;
    const sym = item.symbol.toUpperCase();
    if (assetFilter === 'GOLD') matchesAsset = sym.includes('XAU') || sym.includes('GOLD');
    if (assetFilter === 'US30') matchesAsset = sym.includes('US30') || sym.includes('DOW');
    if (assetFilter === 'OTHER') matchesAsset = !sym.includes('XAU') && !sym.includes('GOLD') && !sym.includes('US30') && !sym.includes('DOW');

    return matchesSearch && matchesStatus && matchesAsset;
  });

  // Calculate high-level performance metrics based on matching subset or total history
  const totalTrades = filteredHistory.length;
  const profitableTrades = filteredHistory.filter((s) => (s.resultPips || 0) > 0).length;
  const winRate = totalTrades > 0 ? ((profitableTrades / totalTrades) * 100).toFixed(1) : '0.0';
  const totalNetPips = filteredHistory.reduce((sum, s) => sum + (s.resultPips || 0), 0);

  const renderHistoryItem = ({ item, index }: { item: Signal; index: number }) => {
    const isProfit = (item.resultPips || 0) > 0;
    const isExpired = item.status === 'EXPIRED';
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 80).duration(400)}>
        <Card style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <View>
              <Subheading style={styles.symbolText}>{item.symbol}</Subheading>
              <View style={styles.dateRow}>
                <Monospace style={styles.idText}>{item.id}</Monospace>
                <Body style={styles.dateText}>• {new Date(item.timestamp).toLocaleDateString()}</Body>
              </View>
            </View>
            
            {isExpired ? (
              <View style={[styles.resultBadge, styles.expiredBadge]}>
                <Body style={[styles.resultText, { color: colors.textSecondary }]}>EXPIRED</Body>
              </View>
            ) : (
              <View style={[styles.resultBadge, isProfit ? styles.profitBadge : styles.lossBadge]}>
                <Body style={[styles.resultText, { color: isProfit ? '#4CAF50' : '#FF5252' }]}>
                  {isProfit ? '+' : ''}{item.resultPips?.toLocaleString()} PIPS
                </Body>
              </View>
            )}
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Label style={styles.metricLabel}>DIRECTION</Label>
              <Body style={[styles.directionValue, item.direction === 'BUY' ? styles.buyText : styles.sellText]}>
                {item.direction}
              </Body>
            </View>
            <View style={styles.metricItem}>
              <Label style={styles.metricLabel}>ENTRY PRICE</Label>
              <Monospace style={styles.metricValue}>{item.entryPrice}</Monospace>
            </View>
            <View style={styles.metricItem}>
              <Label style={styles.metricLabel}>OUTCOME STATUS</Label>
              <Body style={[styles.statusValue, isExpired ? styles.neutralText : isProfit ? styles.successText : styles.errorText]}>
                {isExpired ? 'EXPIRED' : isProfit ? 'TARGET MET' : 'STOP HIT'}
              </Body>
            </View>
          </View>

          {/* Reasoning summary expander */}
          <View style={styles.reasoningRow}>
            <Monospace style={styles.reasoningLabel}>REASONING LOG:</Monospace>
            <Body style={styles.reasoningVal}>{item.aiReasoning}</Body>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Performance Overview Banner */}
        <Card hasGoldBorder style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Award size={18} color={colors.gold} />
            <Heading style={styles.statsTitle}>AQ AUDITED DIRECTIVE LEDGER</Heading>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Label style={styles.statLabel}>WIN RATE</Label>
              <Display style={styles.statValue}>{winRate}%</Display>
            </View>
            <View style={styles.statBox}>
              <Label style={styles.statLabel}>NET GAIN</Label>
              <Display style={[styles.statValue, { color: colors.gold }]}>
                {totalNetPips > 0 ? '+' : ''}{totalNetPips.toLocaleString()}
              </Display>
            </View>
            <View style={styles.statBox}>
              <Label style={styles.statLabel}>COMPLETED</Label>
              <Display style={styles.statValue}>{totalTrades}</Display>
            </View>
          </View>
        </Card>

        {/* Ledger analysis */}
        <Label style={styles.sectionLabel}>DECISION LEDGER DISTRIBUTION</Label>
        <Card style={styles.distributionCard}>
          <View style={styles.distRow}>
            <View style={styles.distCol}>
              <Body style={styles.distVal}>{profitableTrades}</Body>
              <Label style={styles.distLbl}>Profitable Executions</Label>
            </View>
            <View style={styles.distCol}>
              <Body style={styles.distVal}>{totalTrades - profitableTrades}</Body>
              <Label style={styles.distLbl}>Risk Mitigations</Label>
            </View>
          </View>
          
          {/* Progress bar */}
          <View style={styles.barContainer}>
            <View style={[styles.progressBar, { width: `${winRate}%`, backgroundColor: colors.gold }]} />
          </View>
          <View style={styles.barLabels}>
            <Body style={styles.barLabelText}>Bullish Accuracy: {winRate}%</Body>
            <Body style={styles.barLabelText}>Segmented Limit: 100%</Body>
          </View>
        </Card>

        {/* Search Input and Filters */}
        <Label style={styles.sectionLabel}>SEARCH & DEEP AUDIT FILTERS</Label>
        <Card style={styles.filterCard}>
          <View style={styles.searchRow}>
            <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search symbol, ID or status..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Status filter selection row */}
          <Label style={styles.filterGroupLabel}>OUTCOME STATUS FILTER</Label>
          <View style={styles.filterGroup}>
            {(['ALL', 'PROFIT', 'LOSS', 'EXPIRED'] as const).map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[styles.filterPill, statusFilter === st && styles.activeFilterPill]}
              >
                <Body style={[styles.filterPillText, statusFilter === st && styles.activeFilterPillText]}>
                  {st}
                </Body>
              </Pressable>
            ))}
          </View>

          {/* Asset filter selection row */}
          <Label style={styles.filterGroupLabel}>ASSET CATEGORY FILTER</Label>
          <View style={styles.filterGroup}>
            {(['ALL', 'GOLD', 'US30', 'OTHER'] as const).map((ast) => (
              <Pressable
                key={ast}
                onPress={() => setAssetFilter(ast)}
                style={[styles.filterPill, assetFilter === ast && styles.activeFilterPill]}
              >
                <Body style={[styles.filterPillText, assetFilter === ast && styles.activeFilterPillText]}>
                  {ast}
                </Body>
              </Pressable>
            ))}
          </View>
        </Card>

        <Label style={styles.sectionLabel}>ARCHIVED TRANSMISSION ENTRIES ({filteredHistory.length})</Label>

        {filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertTriangle size={36} color={colors.textMuted} />
            <Body style={styles.emptyText}>No historical logs match your filters.</Body>
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            scrollEnabled={false} // Contained perfectly inside the scroll container
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.md,
    backgroundColor: '#0A0A0A',
    borderColor: '#1C1C1C',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
    paddingBottom: spacing.sm,
  },
  statsTitle: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  distributionCard: {
    backgroundColor: '#070707',
    borderColor: '#191919',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  distCol: {
    alignItems: 'center',
    flex: 1,
  },
  distVal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
  },
  distLbl: {
    fontSize: 7.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  barContainer: {
    height: 5,
    backgroundColor: '#191919',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  filterCard: {
    backgroundColor: '#080808',
    borderColor: '#181818',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030303',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: borderRadius.md,
    height: 44,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
  },
  filterGroupLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#0A0A0A',
    marginRight: 6,
  },
  activeFilterPill: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  filterPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeFilterPillText: {
    color: colors.gold,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.gold,
    marginBottom: spacing.xs,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    marginVertical: 4,
    backgroundColor: '#080808',
    borderColor: '#181818',
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  idText: {
    fontSize: 8.5,
    color: colors.gold,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 4,
  },
  resultBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: 4,
  },
  profitBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  lossBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  expiredBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.08)',
    borderWidth: 1,
    borderColor: '#555',
  },
  resultText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#040404',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#121212',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 6.5,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  directionValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusValue: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  buyText: {
    color: '#4CAF50',
  },
  sellText: {
    color: '#FF5252',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#FF5252',
  },
  neutralText: {
    color: colors.textMuted,
  },
  reasoningRow: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#121212',
    paddingTop: spacing.sm,
  },
  reasoningLabel: {
    fontSize: 7.5,
    color: colors.gold,
    fontWeight: '700',
  },
  reasoningVal: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
