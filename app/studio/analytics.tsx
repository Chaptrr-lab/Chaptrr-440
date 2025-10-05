import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Coins, DollarSign, TrendingUp, Eye, Heart, BookOpen } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

const COINS_TO_USD = 100;

interface EarningsCardProps {
  title: string;
  coins: number;
  usd: number;
  icon: React.ReactNode;
}

function EarningsCard({ title, coins, usd, icon }: EarningsCardProps) {
  const { activeTheme } = useTheme();
  
  return (
    <View style={[styles.earningsCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
      <View style={styles.earningsHeader}>
        {icon}
        <Text style={[styles.earningsTitle, { color: activeTheme.colors.text.primary }]}>{title}</Text>
      </View>
      <View style={styles.earningsAmounts}>
        <View style={styles.earningsRow}>
          <Coins size={20} color="#f59e0b" />
          <Text style={[styles.earningsCoins, { color: activeTheme.colors.text.primary }]}>{coins.toLocaleString()}</Text>
        </View>
        <Text style={[styles.earningsUSD, { color: activeTheme.colors.text.muted }]}>${usd.toFixed(2)} USD</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stories' | 'chapters'>('overview');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'overall'>('overall');

  const getEarningsForTimeFilter = () => {
    switch (timeFilter) {
      case 'today':
        return { coins: 150, usd: 1.5, views: 320, likes: 45, reads: 180 };
      case 'week':
        return { coins: 980, usd: 9.8, views: 2100, likes: 280, reads: 1200 };
      case 'month':
        return { coins: 4200, usd: 42, views: 8900, likes: 1100, reads: 5100 };
      case 'year':
        return { coins: 48500, usd: 485, views: 102000, likes: 12800, reads: 58000 };
      case 'overall':
      default:
        return { coins: 12450, usd: 124.5, views: 24500, likes: 3200, reads: 12800 };
    }
  };

  const earnings = getEarningsForTimeFilter();
  const totalCoins = earnings.coins;
  const totalUSD = earnings.usd;

  const mockStoryEarnings = [
    { id: '1', title: 'Digital Nomad Chronicles', coins: 5200, usd: 52, reads: 1240, likes: 320 },
    { id: '2', title: 'Tokyo Nights', coins: 4100, usd: 41, reads: 980, likes: 250 },
    { id: '3', title: 'Minimalist Journey', coins: 3150, usd: 31.5, reads: 750, likes: 180 },
  ];

  const mockChapterEarnings = [
    { id: '1', storyTitle: 'Digital Nomad Chronicles', chapterTitle: 'Bali Beginnings', coins: 850, reads: 420 },
    { id: '2', storyTitle: 'Digital Nomad Chronicles', chapterTitle: 'The Breaking Point', coins: 720, reads: 360 },
    { id: '3', storyTitle: 'Tokyo Nights', chapterTitle: 'Shibuya Crossing', coins: 680, reads: 340 },
    { id: '4', storyTitle: 'Tokyo Nights', chapterTitle: 'Neon Dreams', coins: 590, reads: 295 },
    { id: '5', storyTitle: 'Minimalist Journey', chapterTitle: 'The 100-Item Challenge', coins: 520, reads: 260 },
  ];

  const handleCoinBalance = () => {
    // Stub: Open coin management modal
    console.log('Open coin management');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
        <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.colors.background} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.text.primary }]}>Income & Performance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coin Balance */}
        <View style={[styles.coinBalanceCard, { backgroundColor: activeTheme.colors.card, borderColor: '#f59e0b' }]}>
          <View style={styles.coinBalanceHeader}>
            <Coins size={32} color="#f59e0b" />
            <View style={styles.coinBalanceInfo}>
              <Text style={[styles.coinBalanceAmount, { color: activeTheme.colors.text.primary }]}>{totalCoins.toLocaleString()}</Text>
              <Text style={styles.coinBalanceLabel}>Coins</Text>
            </View>
          </View>
          <View style={styles.coinBalanceUSD}>
            <DollarSign size={20} color="#10b981" />
            <Text style={[styles.coinBalanceUSDText, { color: activeTheme.colors.text.primary }]}>${totalUSD.toFixed(2)} USD</Text>
          </View>
        </View>

        {/* Time Filter */}
        <View style={[styles.timeFilterContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
          <TouchableOpacity 
            style={[styles.timeFilterButton, timeFilter === 'today' && { backgroundColor: activeTheme.colors.accent }]}
            onPress={() => setTimeFilter('today')}
          >
            <Text style={[styles.timeFilterText, { color: activeTheme.colors.text.secondary }, timeFilter === 'today' && { color: activeTheme.colors.background }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeFilterButton, timeFilter === 'week' && { backgroundColor: activeTheme.colors.accent }]}
            onPress={() => setTimeFilter('week')}
          >
            <Text style={[styles.timeFilterText, { color: activeTheme.colors.text.secondary }, timeFilter === 'week' && { color: activeTheme.colors.background }]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeFilterButton, timeFilter === 'month' && { backgroundColor: activeTheme.colors.accent }]}
            onPress={() => setTimeFilter('month')}
          >
            <Text style={[styles.timeFilterText, { color: activeTheme.colors.text.secondary }, timeFilter === 'month' && { color: activeTheme.colors.background }]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeFilterButton, timeFilter === 'year' && { backgroundColor: activeTheme.colors.accent }]}
            onPress={() => setTimeFilter('year')}
          >
            <Text style={[styles.timeFilterText, { color: activeTheme.colors.text.secondary }, timeFilter === 'year' && { color: activeTheme.colors.background }]}>Year</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeFilterButton, timeFilter === 'overall' && { backgroundColor: activeTheme.colors.accent }]}
            onPress={() => setTimeFilter('overall')}
          >
            <Text style={[styles.timeFilterText, { color: activeTheme.colors.text.secondary }, timeFilter === 'overall' && { color: activeTheme.colors.background }]}>Overall</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: activeTheme.colors.border }]}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, { color: activeTheme.colors.text.secondary }, selectedTab === 'overview' && { color: activeTheme.colors.accent }]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'stories' && styles.tabActive]}
            onPress={() => setSelectedTab('stories')}
          >
            <Text style={[styles.tabText, { color: activeTheme.colors.text.secondary }, selectedTab === 'stories' && { color: activeTheme.colors.accent }]}>
              By Story
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'chapters' && styles.tabActive]}
            onPress={() => setSelectedTab('chapters')}
          >
            <Text style={[styles.tabText, { color: activeTheme.colors.text.secondary }, selectedTab === 'chapters' && { color: activeTheme.colors.accent }]}>
              By Chapter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Overall Earnings</Text>
            <EarningsCard
              title="Total Earnings"
              coins={totalCoins}
              usd={totalUSD}
              icon={<TrendingUp size={20} color="#10b981" />}
            />

            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary, marginTop: 24 }]}>Performance Stats</Text>
            <View style={[styles.statsGrid, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
              <View style={styles.statItem}>
                <Eye size={24} color="#6366f1" />
                <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>{earnings.views.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: activeTheme.colors.text.muted }]}>Views</Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={24} color="#ef4444" />
                <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>{earnings.likes.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: activeTheme.colors.text.muted }]}>Likes</Text>
              </View>
              <View style={styles.statItem}>
                <BookOpen size={24} color="#10b981" />
                <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>{earnings.reads.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: activeTheme.colors.text.muted }]}>Reads</Text>
              </View>
            </View>
          </View>
        )}

        {/* By Story Tab */}
        {selectedTab === 'stories' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Earnings by Story</Text>
            {mockStoryEarnings.map((story) => (
              <View key={story.id} style={[styles.storyCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
                <Text style={[styles.storyTitle, { color: activeTheme.colors.text.primary }]}>{story.title}</Text>
                <View style={styles.storyStats}>
                  <View style={styles.storyStatRow}>
                    <Coins size={16} color="#f59e0b" />
                    <Text style={[styles.storyStatText, { color: activeTheme.colors.text.primary }]}>{story.coins.toLocaleString()} coins</Text>
                  </View>
                  <Text style={[styles.storyStatUSD, { color: activeTheme.colors.text.muted }]}>${story.usd.toFixed(2)} USD</Text>
                </View>
                <View style={styles.storyMetrics}>
                  <View style={styles.metricItem}>
                    <BookOpen size={14} color={activeTheme.colors.text.muted} />
                    <Text style={[styles.metricText, { color: activeTheme.colors.text.muted }]}>{story.reads} reads</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Heart size={14} color={activeTheme.colors.text.muted} />
                    <Text style={[styles.metricText, { color: activeTheme.colors.text.muted }]}>{story.likes} likes</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* By Chapter Tab */}
        {selectedTab === 'chapters' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Earnings by Chapter</Text>
            {mockChapterEarnings.map((chapter) => (
              <View key={chapter.id} style={[styles.chapterCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
                <View style={styles.chapterInfo}>
                  <Text style={[styles.chapterTitle, { color: activeTheme.colors.text.primary }]}>{chapter.chapterTitle}</Text>
                  <Text style={[styles.chapterStory, { color: activeTheme.colors.text.muted }]}>{chapter.storyTitle}</Text>
                </View>
                <View style={styles.chapterEarnings}>
                  <View style={styles.chapterCoins}>
                    <Coins size={14} color="#f59e0b" />
                    <Text style={[styles.chapterCoinsText, { color: activeTheme.colors.text.primary }]}>{chapter.coins}</Text>
                  </View>
                  <Text style={[styles.chapterReads, { color: activeTheme.colors.text.muted }]}>{chapter.reads} reads</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backIcon: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  coinBalanceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  coinBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinBalanceInfo: {
    marginLeft: 16,
  },
  coinBalanceAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  coinBalanceLabel: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
  coinBalanceUSD: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinBalanceUSDText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  earningsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  earningsAmounts: {
    gap: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsCoins: {
    fontSize: 24,
    fontWeight: '700',
  },
  earningsUSD: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  storyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  storyStats: {
    marginBottom: 8,
  },
  storyStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  storyStatText: {
    fontSize: 18,
    fontWeight: '700',
  },
  storyStatUSD: {
    fontSize: 14,
  },
  storyMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
  },
  chapterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterStory: {
    fontSize: 12,
  },
  chapterEarnings: {
    alignItems: 'flex-end',
  },
  chapterCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  chapterCoinsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chapterReads: {
    fontSize: 12,
  },
});
