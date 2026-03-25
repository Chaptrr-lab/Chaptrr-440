import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

type ThemeMode = 'light' | 'dark';

export default function SettingsScreen() {
  const { mode, activeTheme, setMode } = useTheme();

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { color: activeTheme.colors.text.primary },
        }}
      />
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={activeTheme.colors.background}
      />

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>
            Appearance
          </Text>
          
          <View style={[styles.themeContainer, { 
            backgroundColor: activeTheme.colors.card,
            borderColor: activeTheme.colors.border 
          }]}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  { borderBottomColor: activeTheme.colors.border },
                  mode === option.value && { 
                    backgroundColor: activeTheme.colors.accent + '20',
                    borderColor: activeTheme.colors.accent 
                  }
                ]}
                onPress={() => setMode(option.value)}
              >
                <View style={[
                  styles.radioButton,
                  { borderColor: activeTheme.colors.border },
                  mode === option.value && { 
                    backgroundColor: activeTheme.colors.accent,
                    borderColor: activeTheme.colors.accent 
                  }
                ]}>
                  {mode === option.value && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={[
                  styles.themeLabel,
                  { color: activeTheme.colors.text.primary },
                  mode === option.value && { color: activeTheme.colors.accent }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  themeContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});