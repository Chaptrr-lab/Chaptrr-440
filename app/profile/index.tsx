import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SafeImage from '@/ui/SafeImage';
import {
  ChevronRight,
  LogOut,
  Pencil,
  BookOpen,
  CheckCircle,
  BookMarked,
  Clock,
  Star,
} from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SETTINGS_ROWS = [
  { label: 'Reading Preferences', route: '/reader-settings' },
  { label: 'Theme', route: '/profile/settings' },
  { label: 'Notifications', route: '/profile/settings' },
  { label: 'Account', route: '/profile/settings' },
  { label: 'About Chaptrr', route: '/profile/settings' },
] as const;

const readingStats = [
  { icon: BookOpen, label: 'Stories Read', value: '0' },
  { icon: CheckCircle, label: 'Finished This Month', value: '0' },
  { icon: BookMarked, label: 'Chapters Read', value: '0' },
  { icon: Clock, label: 'Hours This Month', value: '0' },
  { icon: Star, label: 'Favorite Genre', value: '—' },
];

export default function ProfileScreen() {
  const { activeTheme, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const [avatarUri, setAvatarUri] = useState(
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  );
  const [displayName, setDisplayName] = useState('You');
  const [username, setUsername] = useState('@creator');
  const [bio, setBio] = useState('');

  // Edit profile sheet
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);
  const [editAvatarUri, setEditAvatarUri] = useState(avatarUri);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const openEdit = () => {
    setEditName(displayName);
    setEditUsername(username);
    setEditBio(bio);
    setEditAvatarUri(avatarUri);
    setEditVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const closeEdit = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setEditVisible(false));
  };

  const saveEdit = () => {
    setDisplayName(editName.trim() || 'You');
    setUsername(editUsername.trim() || '@creator');
    setBio(editBio.trim());
    setAvatarUri(editAvatarUri);
    closeEdit();
  };

  const handlePickAvatar = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll access.');
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
      setEditAvatarUri(result.assets[0].uri);
    }
  };

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {} },
    ]);
  };

  const c = activeTheme.colors;
  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text.primary,
          headerTitleStyle: { color: c.text.primary },
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + names */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={openEdit} activeOpacity={0.8}>
            <SafeImage
              uri={avatarUri}
              style={styles.avatar}
              resizeMode="cover"
              fallback={<View style={[styles.avatar, { backgroundColor: c.border }]} />}
            />
            <View style={[styles.editBadge, { backgroundColor: c.accent }]}>
              <Pencil size={12} color={c.background} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.displayName, { color: c.text.primary }]}>{displayName}</Text>
          <Text style={[styles.username, { color: c.text.muted }]}>{username}</Text>
          {bio ? (
            <Text style={[styles.bio, { color: c.text.secondary }]}>{bio}</Text>
          ) : null}
        </View>

        {/* Reading stats */}
        <Text style={[styles.sectionTitle, { color: c.text.primary }]}>Reading Stats</Text>
        <View style={[styles.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {readingStats.map((stat, i) => {
            const Icon = stat.icon;
            const last = i === readingStats.length - 1;
            return (
              <View
                key={stat.label}
                style={[
                  styles.statRow,
                  !last && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
              >
                <Icon size={18} color={c.accent} style={{ marginRight: 12 }} />
                <Text style={[styles.statLabel, { color: c.text.secondary }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: c.text.primary }]}>{stat.value}</Text>
              </View>
            );
          })}
        </View>

        {/* Settings list */}
        <Text style={[styles.sectionTitle, { color: c.text.primary }]}>Settings</Text>
        <View style={[styles.settingsList, { backgroundColor: c.surface, borderColor: c.border }]}>
          {SETTINGS_ROWS.map((row, i) => {
            const last = i === SETTINGS_ROWS.length - 1;
            return (
              <TouchableOpacity
                key={row.label}
                style={[
                  styles.settingsRow,
                  !last && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
                onPress={() => router.push(row.route as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.settingsRowLabel, { color: c.text.primary }]}>
                  {row.label}
                </Text>
                <ChevronRight size={18} color={c.text.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logOutButton} onPress={handleLogOut} activeOpacity={0.8}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logOutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile bottom sheet */}
      <Modal
        visible={editVisible}
        transparent
        animationType="none"
        onRequestClose={closeEdit}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEdit}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: c.surface, transform: [{ translateY }] },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text.primary }]}>Edit Profile</Text>

            {/* Avatar picker */}
            <TouchableOpacity style={styles.sheetAvatarRow} onPress={handlePickAvatar} activeOpacity={0.8}>
              <SafeImage
                uri={editAvatarUri}
                style={styles.sheetAvatar}
                resizeMode="cover"
                fallback={<View style={[styles.sheetAvatar, { backgroundColor: c.border }]} />}
              />
              <Text style={[styles.sheetAvatarChange, { color: c.accent }]}>Change Photo</Text>
            </TouchableOpacity>

            {/* Fields */}
            <Text style={[styles.fieldLabel, { color: c.text.muted }]}>Display Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: c.background, borderColor: c.border, color: c.text.primary }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={c.text.muted}
              maxLength={50}
            />

            <Text style={[styles.fieldLabel, { color: c.text.muted }]}>Username</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: c.background, borderColor: c.border, color: c.text.primary }]}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="@username"
              placeholderTextColor={c.text.muted}
              autoCapitalize="none"
              maxLength={30}
            />

            <Text style={[styles.fieldLabel, { color: c.text.muted }]}>
              Bio{' '}
              <Text style={{ fontWeight: '400' }}>{editBio.length}/150</Text>
            </Text>
            <TextInput
              style={[
                styles.fieldInput,
                styles.fieldInputMulti,
                { backgroundColor: c.background, borderColor: c.border, color: c.text.primary },
              ]}
              value={editBio}
              onChangeText={(t) => { setBio(t.slice(0, 150)); setEditBio(t.slice(0, 150)); }}
              placeholder="A little about you…"
              placeholderTextColor={c.text.muted}
              multiline
              numberOfLines={3}
              maxLength={150}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: c.accent }]}
              onPress={saveEdit}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveButtonText, { color: c.background }]}>Save Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  editBadge: {
    position: 'absolute',
    bottom: 12,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsList: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
  },
  logOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  logOutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal / sheet
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetAvatarRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  sheetAvatarChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 16,
  },
  fieldInputMulti: {
    minHeight: 72,
    paddingTop: 11,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
