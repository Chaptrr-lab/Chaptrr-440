import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SafeImage from '@/ui/SafeImage';
import { Settings, Coins } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const { activeTheme, mode } = useTheme();
  const [avatarUri, setAvatarUri] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');

  const handleUploadAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all demo data including projects, characters, and chapters. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement reset functionality
            Alert.alert('Success', 'Demo data has been reset');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { color: activeTheme.colors.text.primary },
          headerRight: () => (
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => router.push('/profile/settings')}
            >
              <Settings size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={activeTheme.colors.background}
      />

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleUploadAvatar} activeOpacity={0.7}>
            <SafeImage 
              uri={avatarUri}
              style={styles.avatar}
              resizeMode="cover"
              fallback={<View style={[styles.avatar, { backgroundColor: '#666' }]} />}
            />
            <View style={[styles.avatarBadge, { backgroundColor: activeTheme.colors.accent }]}>
              <Text style={styles.avatarBadgeText}>+</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: activeTheme.colors.text.primary }]}>You</Text>
          <Text style={[styles.username, { color: activeTheme.colors.text.secondary }]}>@creator</Text>
        </View>

        <View style={[styles.statsSection, { borderColor: activeTheme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: activeTheme.colors.text.secondary }]}>Stories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: activeTheme.colors.text.secondary }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: activeTheme.colors.text.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: activeTheme.colors.text.secondary }]}>Following</Text>
          </View>
        </View>

        <View style={styles.coinsSection}>
          <View style={styles.coinsHeader}>
            <Coins size={24} color="#f59e0b" />
            <Text style={styles.coinsTitle}>Coins</Text>
          </View>
          <Text style={[styles.coinsBalance, { color: activeTheme.colors.text.primary }]}>1,000</Text>
          <Text style={[styles.coinsDescription, { color: activeTheme.colors.text.secondary }]}>
            Use coins to unlock premium chapters and support creators
          </Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
            <Text style={styles.resetButtonText}>Reset Demo Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    padding: 4,
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  coinsSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinsTitle: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  coinsBalance: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  coinsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});