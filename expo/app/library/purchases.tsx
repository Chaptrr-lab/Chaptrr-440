import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/app-store';
import { goBackOrFallback } from '@/lib/navigation';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft } from 'lucide-react-native';

export default function PurchasesScreen() {
  const { activeTheme } = useTheme();
  const projects = useAppStore((state) => state.projects);

  const purchases = [
    { id: '1', project: projects[0], chapterTitle: 'Bali Beginnings', amount: 5, date: 'Jan 15, 2024' },
    { id: '2', project: projects[1], chapterTitle: 'Neon Dreams', amount: 3, date: 'Jan 12, 2024' },
    { id: '3', project: projects[2], chapterTitle: 'Minimalist Life', amount: 5, date: 'Jan 10, 2024' },
    { id: '4', project: projects[0], chapterTitle: 'Island Paradise', amount: 5, date: 'Jan 8, 2024' },
    { id: '5', project: projects[1], chapterTitle: 'Tokyo Lights', amount: 3, date: 'Jan 5, 2024' },
    { id: '6', project: projects[2], chapterTitle: 'Simple Living', amount: 5, date: 'Jan 1, 2024' },
  ];

  const renderPurchaseItem = ({ item }: { item: any }) => (
    <View style={[styles.purchaseItem, { backgroundColor: activeTheme.colors.card }]}>
      <SafeImage 
        uri={item.project.cover} 
        style={styles.purchaseThumbnail}
        resizeMode="cover"
        fallback={<View style={[styles.purchaseThumbnail, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.purchaseInfo}>
        <Text style={[styles.purchaseChapter, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {item.chapterTitle}
        </Text>
        <Text style={[styles.purchaseProject, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {item.project.title}
        </Text>
        <Text style={[styles.purchaseDate, { color: activeTheme.colors.text.muted }]}>{item.date}</Text>
      </View>
      <View style={styles.purchaseAmount}>
        <Text style={styles.purchaseAmountText}>{item.amount} coins</Text>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    listContent: {
      padding: 20,
    },
    purchaseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    purchaseThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 6,
      marginRight: 12,
    },
    purchaseInfo: {
      flex: 1,
    },
    purchaseChapter: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    purchaseProject: {
      fontSize: 12,
      marginBottom: 2,
    },
    purchaseDate: {
      fontSize: 11,
    },
    purchaseAmount: {
      alignItems: 'flex-end',
    },
    purchaseAmountText: {
      color: '#f59e0b',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Purchase Log',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => goBackOrFallback(router, '/(tabs)/library')} style={styles.backButton}>
              <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <FlatList
        data={purchases}
        renderItem={renderPurchaseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
